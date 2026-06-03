import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type ForgeStudioPortalRow = {
  id: string;
  token: string;
  product_id: string;
  title: string;
  subtitle: string | null;
  allowed_templates: string[];
  allowed_scenarios: string[];
  allowed_direction_slugs: string[] | null;
  allowed_formats: string[];
  max_generations_per_day: number;
  generations_today: number;
  generations_day: string | null;
  is_active: boolean;
  expires_at: string | null;
};

export async function loadActiveStudioPortal(
  admin: SupabaseClient,
  token: string,
): Promise<ForgeStudioPortalRow | null> {
  const clean = String(token ?? "").trim().slice(0, 64);
  if (!clean) return null;

  const { data, error } = await admin
    .from("forge_studio_portals")
    .select("*")
    .eq("token", clean)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const portal = data as ForgeStudioPortalRow;
  if (portal.expires_at && new Date(portal.expires_at) < new Date()) return null;
  return portal;
}

export function assertPortalAllows(
  portal: ForgeStudioPortalRow,
  field: "templates" | "scenarios" | "formats" | "directions",
  value: string | null | undefined,
): boolean {
  if (!value) return field === "directions";
  const v = String(value).trim();
  if (!v) return field === "directions";

  switch (field) {
    case "templates":
      return portal.allowed_templates.includes(v);
    case "scenarios":
      return portal.allowed_scenarios.includes(v);
    case "formats":
      return portal.allowed_formats.includes(v);
    case "directions":
      if (!portal.allowed_direction_slugs?.length) return true;
      return portal.allowed_direction_slugs.includes(v);
    default:
      return false;
  }
}

export async function bumpStudioPortalGeneration(
  admin: SupabaseClient,
  portal: ForgeStudioPortalRow,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  let count = portal.generations_today;
  if (portal.generations_day !== today) count = 0;
  count += 1;

  if (count > portal.max_generations_per_day) {
    throw new Error("daily_limit");
  }

  const { error } = await admin
    .from("forge_studio_portals")
    .update({
      generations_today: count,
      generations_day: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", portal.id);
  if (error) throw error;
}

function slugifyBase(input: string): string {
  const lower = (input ?? "").toLowerCase().trim();
  let out = "";
  for (const ch of lower) {
    if (/[a-z0-9]/.test(ch)) out += ch;
    else if (/\s|[-_]/.test(ch)) out += "-";
  }
  return out.replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "landing";
}

export async function ensureUniquePrototypeSlug(
  admin: SupabaseClient,
  name: string,
): Promise<string> {
  const base = slugifyBase(name);
  for (let i = 0; i < 8; i++) {
    const suffix = i === 0 ? "" : `-${Math.random().toString(36).slice(2, 6)}`;
    const candidate = `${base}${suffix}`.slice(0, 58);
    const { data } = await admin
      .from("forge_prototypes")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 58);
}
