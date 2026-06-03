import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** share_id: 8–32 alphanumeric (from UUID slice). */
const SHARE_ID_RE = /^[a-z0-9]{8,32}$/i;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    let shareId: string | null = null;
    try {
      const body = await req.json();
      shareId = body?.share_id ?? body?.id ?? null;
    } catch {
      const url = new URL(req.url);
      shareId = url.searchParams.get("share_id") ?? url.searchParams.get("id");
    }

    if (!shareId || !SHARE_ID_RE.test(shareId)) {
      return new Response(JSON.stringify({ error: "Invalid share_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase env not configured");

    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/niche_snapshots?select=id,project_id,artifacts,strategies,generated_at,status,share_id&share_id=eq.${encodeURIComponent(shareId)}&status=eq.completed&limit=1`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      },
    );
    if (!resp.ok) {
      const t = await resp.text();
      console.error("DB error:", resp.status, t);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const rows = await resp.json();
    const row = rows?.[0];
    if (!row?.artifacts) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        snapshot: {
          id: row.id,
          project_id: row.project_id,
          artifacts: row.artifacts,
          strategies: row.strategies ?? {},
          generated_at: row.generated_at,
          share_id: row.share_id,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("get-shared-niche-snapshot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
