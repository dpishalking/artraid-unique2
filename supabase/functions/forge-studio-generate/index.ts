/**
 * Публичная генерация прототипа через Studio-портал (token, без staff auth).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { runForgePrototypeGeneration } from "../_shared/forgePrototypeGenerateCore.ts";
import {
  assertPortalAllows,
  bumpStudioPortalGeneration,
  loadActiveStudioPortal,
} from "../_shared/forgeStudioPortal.ts";

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
    const {
      token,
      template_id,
      scenario_id,
      direction_slug,
      format,
      name,
      included_blocks,
      clip_step_blocks,
    } = body ?? {};

    const cleanToken = String(token ?? "").trim();
    const cleanName = String(name ?? "").trim().slice(0, 120);
    if (!cleanToken || !template_id || !cleanName) {
      return ok({ error: "token, template_id, name required" }, { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const portal = await loadActiveStudioPortal(admin, cleanToken);
    if (!portal) return ok({ error: "portal not found" }, { status: 404 });

    if (!assertPortalAllows(portal, "templates", String(template_id))) {
      return ok({ error: "template not allowed" }, { status: 403 });
    }
    if (scenario_id && !assertPortalAllows(portal, "scenarios", String(scenario_id))) {
      return ok({ error: "scenario not allowed" }, { status: 403 });
    }
    if (format && !assertPortalAllows(portal, "formats", String(format))) {
      return ok({ error: "format not allowed" }, { status: 403 });
    }
    const dirSlug =
      direction_slug && String(direction_slug).trim() ? String(direction_slug).trim() : null;
    if (dirSlug && !assertPortalAllows(portal, "directions", dirSlug)) {
      return ok({ error: "direction not allowed" }, { status: 403 });
    }

    try {
      await bumpStudioPortalGeneration(admin, portal);
    } catch (e) {
      if (e instanceof Error && e.message === "daily_limit") {
        return ok({ error: "Достигнут дневной лимит генераций. Попробуйте завтра." }, { status: 429 });
      }
      throw e;
    }

    const result = await runForgePrototypeGeneration({
      admin,
      product_id: portal.product_id,
      template_id: String(template_id),
      scenario_id: scenario_id ? String(scenario_id) : null,
      direction_slug: dirSlug,
      format: format ? String(format) : null,
      name: cleanName,
      notes: "studio",
      included_blocks: Array.isArray(included_blocks) ? included_blocks : null,
      clip_step_blocks: clip_step_blocks ?? null,
      created_by: null,
      studio_portal_id: portal.id,
      auto_publish: true,
    });

    return ok({
      prototype_id: result.prototype_id,
      version_id: result.version_id,
      version: result.version,
      slug: result.slug,
    });
  } catch (e) {
    console.error("forge-studio-generate error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = /503|high demand|overloaded|UNAVAILABLE/i.test(msg)
      ? 503
      : /429|rate limit|RESOURCE_EXHAUSTED/i.test(msg)
        ? 429
        : 500;
    const userMsg = status === 503
      ? "Модель Gemini перегружена. Подождите 1–2 минуты и попробуйте снова."
      : msg;
    return ok({ error: userMsg, detail: msg }, { status });
  }
});
