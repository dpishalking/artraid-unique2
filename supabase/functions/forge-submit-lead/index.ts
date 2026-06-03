/**
 * Приём лидов с публичных страниц /lp/:slug.
 * verify_jwt = false (форма доступна анонимам).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ok(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return ok({ error: "method" }, { status: 405 });

  try {
    const body = await req.json().catch(() => ({}));
    const {
      prototype_id,
      name,
      phone,
      email,
      message,
      source_step,
      utm,
    } = body ?? {};

    if (!prototype_id || typeof prototype_id !== "string" || !UUID_RE.test(prototype_id)) {
      return ok({ error: "prototype_id required" }, { status: 400 });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase env not configured");

    // Защита от спама: проверим что прототип существует и опубликован
    const protoRes = await fetch(
      `${SUPABASE_URL}/rest/v1/forge_prototypes?select=id,status&id=eq.${prototype_id}&limit=1`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } },
    );
    const protoRows = await protoRes.json().catch(() => []);
    if (!Array.isArray(protoRows) || !protoRows.length) {
      return ok({ error: "prototype not found" }, { status: 404 });
    }
    if (protoRows[0].status !== "published") {
      return ok({ error: "prototype not published" }, { status: 403 });
    }

    const userAgent = req.headers.get("user-agent") ?? null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;

    const payload = {
      prototype_id,
      name: typeof name === "string" ? name.slice(0, 200) : null,
      phone: typeof phone === "string" ? phone.slice(0, 50) : null,
      email: typeof email === "string" ? email.slice(0, 200) : null,
      message: typeof message === "string" ? message.slice(0, 4000) : null,
      source_step: typeof source_step === "string" ? source_step.slice(0, 50) : null,
      utm: utm && typeof utm === "object" ? utm : null,
      user_agent: userAgent,
      ip,
    };

    const r = await fetch(`${SUPABASE_URL}/rest/v1/forge_leads`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("forge-submit-lead insert failed", r.status, text);
      return ok({ error: "db_error" }, { status: 500 });
    }

    return ok({ ok: true });
  } catch (e) {
    console.error("forge-submit-lead error", e);
    return ok(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 },
    );
  }
});
