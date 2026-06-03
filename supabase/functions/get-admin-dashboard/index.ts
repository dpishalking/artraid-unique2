import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { adminCorsHeaders, serviceHeaders, supabaseRestUrl, verifyAdminAccess } from "../_shared/adminAuth.ts";

type Row = Record<string, unknown>;

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() - i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

function countSince(rows: { created_at: string }[], since: Date): number {
  const t = since.getTime();
  return rows.filter((r) => new Date(r.created_at).getTime() >= t).length;
}

function bucketDaily(rows: { created_at: string }[], days: string[]): number[] {
  const map = new Map(days.map((d) => [d, 0]));
  for (const r of rows) {
    const k = dayKey(r.created_at);
    if (map.has(k)) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return days.map((d) => map.get(d) ?? 0);
}

function extractHost(url: string): string | null {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

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

    const [
      profilesResp,
      creditsResp,
      prototypesResp,
      auditsResp,
      feedbackResp,
      txResp,
    ] = await Promise.all([
      fetch(`${base}/rest/v1/profiles?select=user_id,email,display_name,created_at&order=created_at.desc&limit=1000`, { headers }),
      fetch(`${base}/rest/v1/user_credits?select=user_id,balance,total_used,total_purchased,updated_at&limit=1000`, { headers }),
      fetch(`${base}/rest/v1/prototypes?select=id,user_id,status,error,created_at,brief&order=created_at.desc&limit=2000`, { headers }),
      fetch(`${base}/rest/v1/analysis_logs?select=id,url,original_url,status,error,created_at&order=created_at.desc&limit=2000`, { headers }),
      fetch(`${base}/rest/v1/audit_feedback?select=id,nps,thumb,created_at&order=created_at.desc&limit=3000`, { headers }),
      fetch(`${base}/rest/v1/credit_transactions?select=id,user_id,amount,type,description,created_at&order=created_at.desc&limit=500`, { headers }),
    ]);

    for (const [name, resp] of [
      ["profiles", profilesResp],
      ["user_credits", creditsResp],
      ["prototypes", prototypesResp],
      ["analysis_logs", auditsResp],
      ["audit_feedback", feedbackResp],
      ["credit_transactions", txResp],
    ] as const) {
      if (!resp.ok) {
        const t = await resp.text();
        console.error(`admin dashboard fetch ${name}:`, resp.status, t);
        return new Response(JSON.stringify({ error: `DB error: ${name}` }), {
          status: 500,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    const profiles = (await profilesResp.json()) as Row[];
    const credits = (await creditsResp.json()) as Row[];
    const prototypes = (await prototypesResp.json()) as Row[];
    const audits = (await auditsResp.json()) as Row[];
    const feedback = (await feedbackResp.json()) as Row[];
    const transactions = txResp.ok ? ((await txResp.json()) as Row[]) : [];

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const d7 = new Date(todayStart);
    d7.setUTCDate(d7.getUTCDate() - 7);
    const d30 = new Date(todayStart);
    d30.setUTCDate(d30.getUTCDate() - 30);

    const days30 = lastNDays(30);

    const auditRows = audits.map((a) => ({
      id: String(a.id),
      url: String(a.url ?? ""),
      original_url: a.original_url ? String(a.original_url) : null,
      status: String(a.status ?? "unknown"),
      error: a.error ? String(a.error) : null,
      created_at: String(a.created_at),
    }));

    const protoRows = prototypes.map((p) => ({
      id: String(p.id),
      user_id: String(p.user_id),
      status: String(p.status ?? "pending"),
      error: p.error ? String(p.error) : null,
      created_at: String(p.created_at),
      brief: p.brief,
    }));

    const profileRows = profiles.map((p) => ({
      user_id: String(p.user_id),
      email: p.email ? String(p.email) : null,
      display_name: p.display_name ? String(p.display_name) : null,
      created_at: String(p.created_at),
    }));

    const creditsByUser = new Map<string, Row>();
    for (const c of credits) creditsByUser.set(String(c.user_id), c);

    const protoCountByUser = new Map<string, number>();
    const protoReadyByUser = new Map<string, number>();
    for (const p of protoRows) {
      protoCountByUser.set(p.user_id, (protoCountByUser.get(p.user_id) ?? 0) + 1);
      if (p.status === "ready") {
        protoReadyByUser.set(p.user_id, (protoReadyByUser.get(p.user_id) ?? 0) + 1);
      }
    }

    const auditStatus: Record<string, number> = {};
    for (const a of auditRows) {
      auditStatus[a.status] = (auditStatus[a.status] ?? 0) + 1;
    }

    const protoStatus: Record<string, number> = {};
    for (const p of protoRows) {
      protoStatus[p.status] = (protoStatus[p.status] ?? 0) + 1;
    }

    const domainCounts = new Map<string, number>();
    for (const a of auditRows) {
      const host = extractHost(a.original_url || a.url);
      if (!host) continue;
      domainCounts.set(host, (domainCounts.get(host) ?? 0) + 1);
    }
    const topDomains = [...domainCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    const npsValues = feedback
      .map((f) => (typeof f.nps === "number" ? f.nps : null))
      .filter((n): n is number => n !== null);
    const thumbsUp = feedback.filter((f) => f.thumb === "up").length;
    const thumbsDown = feedback.filter((f) => f.thumb === "down").length;

    const users = profileRows.map((p) => {
      const cr = creditsByUser.get(p.user_id);
      return {
        ...p,
        balance: typeof cr?.balance === "number" ? cr.balance : 0,
        total_used: typeof cr?.total_used === "number" ? cr.total_used : 0,
        total_purchased: typeof cr?.total_purchased === "number" ? cr.total_purchased : 0,
        prototypes_total: protoCountByUser.get(p.user_id) ?? 0,
        prototypes_ready: protoReadyByUser.get(p.user_id) ?? 0,
      };
    });

    const overview = {
      users_total: profileRows.length,
      users_7d: countSince(profileRows, d7),
      users_30d: countSince(profileRows, d30),
      audits_total: auditRows.length,
      audits_today: countSince(auditRows, todayStart),
      audits_7d: countSince(auditRows, d7),
      audits_30d: countSince(auditRows, d30),
      prototypes_total: protoRows.length,
      prototypes_today: countSince(protoRows, todayStart),
      prototypes_7d: countSince(protoRows, d7),
      prototypes_30d: countSince(protoRows, d30),
      feedback_total: feedback.length,
      feedback_avg_nps: npsValues.length
        ? Math.round((npsValues.reduce((s, n) => s + n, 0) / npsValues.length) * 10) / 10
        : null,
      feedback_thumbs_up: thumbsUp,
      feedback_thumbs_down: thumbsDown,
      credits_balance_sum: credits.reduce((s, c) => s + (Number(c.balance) || 0), 0),
      credits_used_sum: credits.reduce((s, c) => s + (Number(c.total_used) || 0), 0),
    };

    const daily = {
      labels: days30,
      audits: bucketDaily(auditRows, days30),
      prototypes: bucketDaily(protoRows, days30),
      signups: bucketDaily(profileRows, days30),
    };

    const payload = {
      generated_at: now.toISOString(),
      overview,
      daily,
      audit_status: auditStatus,
      prototype_status: protoStatus,
      top_domains: topDomains,
      users: users.slice(0, 200),
      recent_audits: auditRows.slice(0, 25),
      recent_prototypes: protoRows.slice(0, 25).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        status: p.status,
        error: p.error,
        created_at: p.created_at,
        niche: extractBriefNiche(p.brief),
      })),
      recent_transactions: transactions.slice(0, 30).map((t) => ({
        id: String(t.id),
        user_id: String(t.user_id),
        amount: Number(t.amount),
        type: String(t.type),
        description: t.description ? String(t.description) : null,
        created_at: String(t.created_at),
      })),
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-admin-dashboard error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});

function extractBriefNiche(brief: unknown): string | null {
  if (!brief || typeof brief !== "object") return null;
  const b = brief as Record<string, unknown>;
  const niche = b.niche ?? b.productDescription ?? b.hypothesis;
  return niche ? String(niche).slice(0, 80) : null;
}
