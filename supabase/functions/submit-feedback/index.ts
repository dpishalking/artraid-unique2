import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const {
      audit_id,
      nps,
      thumb,
      comment,
      block_ratings,
      implemented,
      result_metric,
    } = body ?? {};

    if (!audit_id || typeof audit_id !== "string" || !UUID_RE.test(audit_id)) {
      return new Response(JSON.stringify({ error: "audit_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const npsVal =
      typeof nps === "number" && nps >= 1 && nps <= 10 ? Math.round(nps) : null;
    const thumbVal = thumb === "up" || thumb === "down" ? thumb : null;
    const commentVal = typeof comment === "string" ? comment.slice(0, 4000) : null;
    const ratingsVal =
      block_ratings && typeof block_ratings === "object" ? block_ratings : null;
    const implementedVal = Boolean(implemented);
    const resultMetricVal =
      typeof result_metric === "string" ? result_metric.slice(0, 1000) : null;

    if (npsVal === null && thumbVal === null && !commentVal && !ratingsVal && !implementedVal && !resultMetricVal) {
      return new Response(JSON.stringify({ error: "empty feedback" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase env not configured");

    const userAgent = req.headers.get("user-agent") || null;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      null;

    const r = await fetch(`${SUPABASE_URL}/rest/v1/audit_feedback`, {
      method: "POST",
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        audit_id,
        nps: npsVal,
        thumb: thumbVal,
        comment: commentVal,
        block_ratings: ratingsVal,
        implemented: implementedVal,
        result_metric: resultMetricVal,
        user_agent: userAgent,
        ip,
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("feedback insert failed:", r.status, t);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rows = await r.json().catch(() => []);
    return new Response(JSON.stringify({ ok: true, id: rows?.[0]?.id ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-feedback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});