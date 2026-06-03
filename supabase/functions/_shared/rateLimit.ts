/** Simple hourly rate limits via Supabase REST (service role). */

export function clientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    null
  );
}

export async function countRowsSince(
  baseUrl: string,
  serviceKey: string,
  table: string,
  filters: string,
  sinceIso: string,
): Promise<number> {
  const q = `${baseUrl}/rest/v1/${table}?select=id&${filters}&created_at=gte.${encodeURIComponent(sinceIso)}`;
  const r = await fetch(q, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: "count=exact",
    },
  });
  if (!r.ok) {
    console.warn(`rate limit count failed: ${table}`, await r.text());
    return 0;
  }
  const range = r.headers.get("content-range");
  if (range) {
    const m = range.match(/\/(\d+)$/);
    if (m) return parseInt(m[1], 10);
  }
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) ? rows.length : 0;
}

export async function assertRateLimit(opts: {
  baseUrl: string;
  serviceKey: string;
  table: string;
  filters: string;
  maxPerHour: number;
  message: string;
}): Promise<Response | null> {
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const count = await countRowsSince(
    opts.baseUrl,
    opts.serviceKey,
    opts.table,
    opts.filters,
    since,
  );
  if (count >= opts.maxPerHour) {
    return new Response(
      JSON.stringify({ error: "rate_limit", message: opts.message }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }
  return null;
}
