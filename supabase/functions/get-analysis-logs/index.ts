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

    const [logsResp, fbResp] = await Promise.all([
      fetch(
        `${base}/rest/v1/analysis_logs?select=id,url,original_url,referer,user_agent,ip,status,error,created_at,audit&order=created_at.desc&limit=500`,
        { headers },
      ),
      fetch(
        `${base}/rest/v1/audit_feedback?select=id,audit_id,nps,thumb,comment,implemented,result_metric,created_at&order=created_at.desc&limit=2000`,
        { headers },
      ),
    ]);

    if (!logsResp.ok) {
      const t = await logsResp.text();
      console.error("Supabase fetch error (logs):", logsResp.status, t);
      return new Response(JSON.stringify({ error: "DB error" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const logs = await logsResp.json();
    type Fb = {
      id: string;
      audit_id: string;
      nps: number | null;
      thumb: string | null;
      comment: string | null;
      implemented: boolean | null;
      result_metric: string | null;
      created_at: string;
    };
    const allFb: Fb[] = fbResp.ok ? await fbResp.json() : [];
    const fbByAudit = new Map<string, Fb[]>();
    for (const f of allFb) {
      const arr = fbByAudit.get(f.audit_id) ?? [];
      arr.push(f);
      fbByAudit.set(f.audit_id, arr);
    }

    const enriched = (logs as { id: string }[]).map((row) => ({
      ...row,
      feedback: fbByAudit.get(row.id) ?? [],
    }));

    return new Response(JSON.stringify({ logs: enriched }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-analysis-logs error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
