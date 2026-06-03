import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ADMIN_ROLES = new Set(["admin", "super_admin", "support", "analyst", "prompt_manager"]);
const MUTATE_ROLES = new Set(["admin", "super_admin"]);

function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAdminUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  if (!token || !anon || !url || token === anon) return null;

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await client.auth.getUser();
  return user?.id ?? null;
}

export async function hasAdminRole(userId: string, headers: Record<string, string>, base: string): Promise<boolean> {
  const resp = await fetch(
    `${base}/rest/v1/profiles?user_id=eq.${userId}&select=role&limit=1`,
    { headers },
  );
  if (!resp.ok) return false;
  const rows = await resp.json() as { role?: string }[];
  return ADMIN_ROLES.has(rows[0]?.role ?? "");
}

/** Создание пользователей и другие дestructive-операции — только admin / super_admin или ADMIN_EMAILS. */
export async function canMutateAsAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!token || !anon || !url || token === anon) return false;

  const client = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await client.auth.getUser();
  if (!user?.email) return false;

  const adminEmails = parseAdminEmails(Deno.env.get("ADMIN_EMAILS"));
  if (adminEmails.includes(user.email.toLowerCase())) return true;

  if (!serviceKey || !user.id) return false;
  const resp = await fetch(
    `${url}/rest/v1/profiles?user_id=eq.${user.id}&select=role&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  if (!resp.ok) return false;
  const rows = await resp.json() as { role?: string }[];
  return MUTATE_ROLES.has(rows[0]?.role ?? "");
}
