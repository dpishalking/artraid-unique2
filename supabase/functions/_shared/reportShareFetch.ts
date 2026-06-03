const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidShareId(id: string | null | undefined): id is string {
  return !!id && UUID_RE.test(id);
}

export function hostnameFromUrl(siteUrl: string | null | undefined): string {
  if (!siteUrl) return "Сайт";
  try {
    const u = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return siteUrl.slice(0, 48);
  }
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type ReportShareMeta = {
  id: string;
  siteUrl: string;
  hostname: string;
  lossPercent: string;
  mainProblem: string;
  mainLever: string;
};

export async function fetchReportShareMeta(id: string): Promise<ReportShareMeta | null> {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase env not configured");

  const resp = await fetch(
    `${SUPABASE_URL}/rest/v1/analysis_logs?select=id,url,original_url,audit,status&id=eq.${id}&limit=1`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    },
  );
  if (!resp.ok) {
    const t = await resp.text();
    console.error("reportShareFetch DB:", resp.status, t);
    return null;
  }

  const rows = await resp.json();
  const row = rows?.[0];
  if (!row || row.status !== "success" || !row.audit) return null;

  const audit = row.audit as {
    diagnosis?: {
      estimatedLossPercent?: string;
      mainProblem?: string;
      mainLever?: string;
    };
  };

  const siteUrl = (row.original_url || row.url || "") as string;
  const hostname = hostnameFromUrl(siteUrl);
  const lossPercent = audit.diagnosis?.estimatedLossPercent?.trim() || "—";
  const mainProblem = audit.diagnosis?.mainProblem?.trim() || "AI-разбор сайта: где теряются деньги и что исправить первым.";
  const mainLever = audit.diagnosis?.mainLever?.trim() || "";

  return { id, siteUrl, hostname, lossPercent, mainProblem, mainLever };
}
