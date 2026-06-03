/**
 * Генерация прототипа Лаборатории на базе Knowledge Base + Template + Scenario.
 * Staff-only (JWT + is_forge_staff).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { runForgePrototypeGeneration } from "../_shared/forgePrototypeGenerateCore.ts";

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
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader) return ok({ error: "auth required" }, { status: 401 });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth } = await userClient.auth.getUser();
    if (!auth?.user) return ok({ error: "unauth" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const {
      product_id,
      template_id,
      scenario_id,
      name,
      notes,
      direction_slug,
      format,
      prototype_id: bodyPrototypeId,
      regenerate_fresh,
      variation_note,
      included_blocks,
      clip_step_blocks,
    } = body ?? {};
    if (!product_id || !template_id || !name) {
      return ok({ error: "product_id, template_id, name required" }, { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: staffOk } = await admin.rpc("is_forge_staff", { uid: auth.user.id });
    if (!staffOk) return ok({ error: "forbidden" }, { status: 403 });

    const result = await runForgePrototypeGeneration({
      admin,
      product_id,
      template_id,
      scenario_id,
      name: String(name).trim(),
      notes,
      direction_slug,
      format,
      prototype_id: bodyPrototypeId,
      regenerate_fresh,
      variation_note,
      included_blocks,
      clip_step_blocks,
      created_by: auth.user.id,
    });

    return ok(result);
  } catch (e) {
    console.error("forge-generate-prototype error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    const status = /503|high demand|overloaded|UNAVAILABLE/i.test(msg)
      ? 503
      : /429|rate limit|RESOURCE_EXHAUSTED/i.test(msg)
        ? 429
        : msg === "knowledge base not found"
          ? 404
          : msg === "prototype not found for product"
            ? 404
            : msg === "unknown template"
              ? 400
              : 500;
    const userMsg = status === 503
      ? "Модель Gemini перегружена. Подождите 1–2 минуты и попробуйте снова — запрос автоматически уйдёт на резервную модель."
      : msg;
    return ok({ error: userMsg, detail: msg }, { status });
  }
});
