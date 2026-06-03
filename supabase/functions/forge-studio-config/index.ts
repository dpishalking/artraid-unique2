/**
 * Публичная конфигурация Studio-портала по token (без KB/промптов).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadActiveStudioPortal } from "../_shared/forgeStudioPortal.ts";
import { landingScenarios } from "../_shared/landingScenarios.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function ok(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return ok({ error: "method" }, { status: 405 });

  try {
    const body = await req.json().catch(() => ({}));
    const token = String(body?.token ?? "").trim();
    if (!token) return ok({ error: "token required" }, { status: 400 });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const portal = await loadActiveStudioPortal(admin, token);
    if (!portal) return ok({ error: "portal not found" }, { status: 404 });

    const [{ data: product }, { data: kb }, { data: templates }] = await Promise.all([
      admin.from("forge_products").select("id, name, slug").eq("id", portal.product_id).maybeSingle(),
      admin.from("forge_knowledge_base").select("directions").eq("product_id", portal.product_id).maybeSingle(),
      admin
        .from("forge_templates")
        .select("id, title, description, format")
        .eq("is_active", true)
        .in("id", portal.allowed_templates)
        .order("sort_order", { ascending: true }),
    ]);

    if (!product) return ok({ error: "product not found" }, { status: 404 });

    const allDirections = (kb?.directions ?? []) as Array<{ slug?: string; title?: string }>;
    const directions = allDirections
      .filter((d) => d.slug && d.title)
      .filter((d) =>
        !portal.allowed_direction_slugs?.length ||
        portal.allowed_direction_slugs.includes(String(d.slug)),
      )
      .map((d) => ({ slug: String(d.slug), title: String(d.title) }));

    const scenarios = landingScenarios
      .filter((s) => portal.allowed_scenarios.includes(s.id))
      .map((s) => ({ id: s.id, title: s.title, description: s.goal }));

    const formats = portal.allowed_formats.map((id) => {
      const labels: Record<string, string> = {
        kitchen: "Разговор на кухне",
        classic: "Классический",
        agora: "Agora",
        longread: "Лонгрид",
      };
      return { id, label: labels[id] ?? id };
    });

    return ok({
      portal: {
        title: portal.title,
        subtitle: portal.subtitle,
        product_name: product.name,
      },
      templates: templates ?? [],
      scenarios,
      directions,
      formats,
      limits: {
        generations_remaining: Math.max(
          0,
          portal.max_generations_per_day -
            (portal.generations_day === new Date().toISOString().slice(0, 10)
              ? portal.generations_today
              : 0),
        ),
      },
    });
  } catch (e) {
    console.error("forge-studio-config error", e);
    return ok({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
});
