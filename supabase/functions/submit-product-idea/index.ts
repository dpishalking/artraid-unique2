import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { writeAdminLog } from "../_shared/opsLog.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const emailRaw = typeof body.email === "string" ? body.email.trim() : "";
    const pagePath = typeof body.page_path === "string" ? body.page_path.slice(0, 500) : null;
    const source = typeof body.source === "string" ? body.source.slice(0, 64) : "fab";

    if (message.length < 10) {
      return new Response(JSON.stringify({ error: "Напишите чуть подробнее (минимум 10 символов)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: "Слишком длинный текст (максимум 2000 символов)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = emailRaw && EMAIL_RE.test(emailRaw) ? emailRaw.slice(0, 320) : null;
    if (emailRaw && !email) {
      return new Response(JSON.stringify({ error: "Некорректный email." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase env not configured");

    const admin = createClient(supabaseUrl, serviceKey);
    const userAgent = req.headers.get("user-agent") || null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;

    if (ip) {
      const since = new Date(Date.now() - 3_600_000).toISOString();
      const { count } = await admin
        .from("product_ideas")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("created_at", since);
      if ((count ?? 0) >= 8) {
        return new Response(
          JSON.stringify({ error: "Слишком много отправок за час. Попробуйте позже." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    let userId: string | null = null;
    let profileEmail: string | null = null;
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    if (token && anon && token !== anon) {
      const userClient = createClient(supabaseUrl, anon, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      if (user) {
        userId = user.id;
        profileEmail = user.email ?? null;
        const { data: profile } = await admin
          .from("profiles")
          .select("email")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profile?.email) profileEmail = String(profile.email);
      }
    }

    const { data: row, error: insertErr } = await admin
      .from("product_ideas")
      .insert({
        user_id: userId,
        email: email ?? profileEmail,
        message,
        page_path: pagePath,
        source,
        user_agent: userAgent,
        ip,
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("product_ideas insert:", insertErr);
      return new Response(JSON.stringify({ error: "Не удалось сохранить идею." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await writeAdminLog(admin, {
      type: "product_idea",
      message: message.slice(0, 280),
      severity: "info",
      service: "submit-product-idea",
      metadata: {
        idea_id: row.id,
        user_id: userId,
        email: email ?? profileEmail,
        page_path: pagePath,
        source,
      },
    });

    return new Response(JSON.stringify({ ok: true, id: row.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-product-idea error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
