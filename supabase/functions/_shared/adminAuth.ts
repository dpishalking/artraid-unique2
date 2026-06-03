import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { hasAdminRole } from "./adminRbac.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function adminCorsHeaders() {
  return corsHeaders;
}

function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** JWT пользователя из списка ADMIN_EMAILS (через запятую). */
async function verifyAdminJwt(
  req: Request,
): Promise<{ ok: true } | { ok: false; status: number; error: string } | null> {
  const adminEmails = parseAdminEmails(Deno.env.get("ADMIN_EMAILS"));
  if (adminEmails.length === 0) return null;

  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const url = Deno.env.get("SUPABASE_URL");

  if (!token || !anon || !url || token === anon) return null;

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user?.email) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  if (adminEmails.includes(user.email.toLowerCase())) {
    return { ok: true };
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && url) {
    const roleOk = await hasAdminRole(user.id, {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    }, url);
    if (roleOk) return { ok: true };
  }

  return { ok: false, status: 403, error: "Forbidden" };
}

/** Секрет из заголовка x-admin-token (legacy). */
function verifyAdminTokenHeader(req: Request): { ok: true } | { ok: false; status: number; error: string } | null {
  const ADMIN_TOKEN = Deno.env.get("ADMIN_BACKLOG_TOKEN");
  if (!ADMIN_TOKEN) return null;

  const provided = req.headers.get("x-admin-token");
  if (!provided || provided !== ADMIN_TOKEN) return null;

  return { ok: true };
}

export async function verifyAdminAccess(
  req: Request,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const jwt = await verifyAdminJwt(req);
  if (jwt?.ok) return jwt;
  if (jwt && !jwt.ok) return jwt;

  const headerToken = verifyAdminTokenHeader(req);
  if (headerToken?.ok) return headerToken;

  const ADMIN_TOKEN = Deno.env.get("ADMIN_BACKLOG_TOKEN");
  if (!ADMIN_TOKEN) {
    return { ok: false, status: 500, error: "Admin access not configured" };
  }

  return { ok: false, status: 403, error: "Forbidden" };
}

/** @deprecated use verifyAdminAccess */
export async function verifyAdminToken(req: Request) {
  return verifyAdminAccess(req);
}

export function serviceHeaders() {
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };
}

export function supabaseRestUrl() {
  const url = Deno.env.get("SUPABASE_URL");
  if (!url) throw new Error("SUPABASE_URL not configured");
  return url;
}
