import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminCorsHeaders, serviceHeaders, supabaseRestUrl, verifyAdminAccess } from "../_shared/adminAuth.ts";

serve(async (req) => {
  const cors = adminCorsHeaders();
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = await verifyAdminAccess(req);
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const base = supabaseRestUrl();
    const headers = serviceHeaders();

    const resp = await fetch(
      `${base}/rest/v1/prototypes?select=id,user_id,status,error,created_at,brief,content&order=created_at.desc&limit=500`,
      { headers },
    );

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Supabase fetch error:", resp.status, t);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const rows = await resp.json();

    return new Response(JSON.stringify({ rows }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-prototype-logs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
