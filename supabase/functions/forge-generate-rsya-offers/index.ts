/**
 * Генерация текстовых офферов для РСЯ Яндекс Директа на базе Forge KB.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { geminiFlashModel, geminiForcedFunctionCall } from "../_shared/gemini.ts";
import { buildEffectiveKbRow } from "../_shared/forgeDirections.ts";
import { buildForgeKbPromptSection, type ForgeKbRow } from "../_shared/forgeKbPrompt.ts";
import {
  FORGE_RSYA_OFFERS_SCHEMA,
  rsyaOffersSystemInstruction,
} from "../_shared/forgeRsyaOffers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function ok(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function text(v: unknown, max = 220): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function list(items: unknown, max = 6): string[] {
  return Array.isArray(items) ? items.map((x) => text(x, 180)).filter(Boolean).slice(0, max) : [];
}

function summarizePrototypeContent(content: Record<string, unknown> | null | undefined): string {
  if (!content || typeof content !== "object") return "";
  const lines: string[] = [];
  const meta = content.meta as Record<string, unknown> | undefined;
  const sequence = Array.isArray(meta?.sequence) ? meta?.sequence.map(String) : [];
  if (sequence.length) lines.push(`Последовательность блоков: ${sequence.join(" → ")}`);

  const steps = content.steps;
  if (Array.isArray(steps)) {
    lines.push("### Экраны clip-прототипа");
    for (const raw of steps.slice(0, 6)) {
      const s = raw as Record<string, unknown>;
      const hero = s.hero as Record<string, unknown> | undefined;
      const cta = s.cta as Record<string, unknown> | undefined;
      lines.push([
        `- ${text(s.label, 60) || text(s.key, 60)}`,
        hero?.headline ? `headline: ${text(hero.headline)}` : "",
        hero?.subheadline ? `sub: ${text(hero.subheadline)}` : "",
        cta?.label ? `CTA: ${text(cta.label, 80)}` : "",
      ].filter(Boolean).join(" | "));
    }
    return lines.join("\n");
  }

  const blocks = content.blocks as Record<string, unknown> | undefined;
  if (blocks && typeof blocks === "object") {
    lines.push("### Ключевые блоки full-прототипа");
    for (const key of [
      "hero",
      "pain",
      "paradigm_shift",
      "enemy_section",
      "solution",
      "transformation",
      "value",
      "product",
      "social_proof",
      "guarantee",
      "final_cta",
    ]) {
      const block = blocks[key] as Record<string, unknown> | undefined;
      if (!block || typeof block !== "object") continue;
      const title = text(block.headline ?? block.title, 180);
      const sub = text(block.subheadline ?? block.intro ?? block.bridge ?? block.body, 220);
      const cta = text(block.cta, 80);
      const points = list(block.points ?? block.before ?? block.after, 3);
      lines.push([
        `- ${key}`,
        title ? `title: ${title}` : "",
        sub ? `text: ${sub}` : "",
        points.length ? `points: ${points.join("; ")}` : "",
        cta ? `CTA: ${cta}` : "",
      ].filter(Boolean).join(" | "));
    }
  }
  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return ok({ error: "method" }, 405);

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader) return ok({ error: "auth required" }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: auth } = await userClient.auth.getUser();
    if (!auth?.user) return ok({ error: "unauth" }, 401);

    const body = await req.json().catch(() => ({}));
    const productId = String(body?.product_id ?? "").trim();
    const directionSlug = String(body?.direction_slug ?? "").trim() || null;
    const prototypeId = String(body?.prototype_id ?? "").trim() || null;
    if (!productId) return ok({ error: "product_id required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: staffOk } = await admin.rpc("is_forge_staff", { uid: auth.user.id });
    if (!staffOk) return ok({ error: "forbidden" }, 403);

    const [{ data: product }, { data: kbRow }, { data: reviews }, { data: prototype }] = await Promise.all([
      admin.from("forge_products").select("name,slug").eq("id", productId).maybeSingle(),
      admin.from("forge_knowledge_base").select("*").eq("product_id", productId).maybeSingle(),
      admin
        .from("forge_reviews")
        .select("text,author,rating,tags,is_starred")
        .eq("product_id", productId)
        .order("is_starred", { ascending: false })
        .limit(30),
      prototypeId
        ? admin
          .from("forge_prototypes")
          .select("id,name,slug,template_id,status,direction_slug,active_version_id")
          .eq("id", prototypeId)
          .eq("product_id", productId)
          .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!kbRow) return ok({ error: "knowledge base not found" }, 404);
    if (prototypeId && !prototype) return ok({ error: "prototype not found" }, 404);

    let prototypeContext = "";
    if (prototype?.active_version_id) {
      const { data: version } = await admin
        .from("forge_prototype_versions")
        .select("version,content")
        .eq("id", prototype.active_version_id)
        .maybeSingle();
      const summary = summarizePrototypeContent(
        (version as { content?: Record<string, unknown> } | null)?.content,
      );
      if (summary) {
        prototypeContext = [
          "## ВЫБРАННЫЙ ПРОТОТИП / ПОСАДОЧНАЯ",
          `Название: ${prototype.name}`,
          `Шаблон: ${prototype.template_id}`,
          prototype.slug ? `URL: /lp/${prototype.slug}` : "",
          `Версия: ${(version as { version?: number } | null)?.version ?? "active"}`,
          "",
          summary,
        ].filter(Boolean).join("\n");
      }
    }

    const effectiveKb = buildEffectiveKbRow(
      kbRow as Record<string, unknown>,
      directionSlug,
    ) as unknown as ForgeKbRow;

    const allReviews = (reviews ?? []) as Array<{ tags?: string[] }>;
    let relevantReviews = allReviews;
    if (directionSlug) {
      const tagged = allReviews.filter((r) => (r.tags ?? []).includes(directionSlug));
      if (tagged.length >= 2) relevantReviews = tagged;
    }

    const kbSection = buildForgeKbPromptSection(effectiveKb, relevantReviews as any[]);
    const directionTitle = (effectiveKb as ForgeKbRow & { _direction_title?: string })._direction_title;

    const userText = [
      kbSection,
      "## ЗАДАЧА",
      `Продукт: ${(product as { name?: string } | null)?.name ?? "продукт"}`,
      directionTitle ? `Направление: ${directionTitle}` : "Направление: общая база продукта",
      prototypeContext,
      "Сгенерируй 10 текстовых офферов для РСЯ Яндекс Директа.",
      prototypeContext
        ? "Каждый оффер должен быть отдельной гипотезой для теста, но все они должны вести именно в выбранный прототип и попадать в его обещание/первый экран."
        : "Каждый оффер должен быть отдельной гипотезой для теста: разный сегмент, угол, первый экран посадочной.",
      "Не копируй лендинговые заголовки целиком. Делай короткие рекламные связки.",
      "landing_hook заполняй конкретно: какой экран/блок выбранного прототипа должен принять этот оффер.",
      "Факты, доказательства, ограничения, цены, гарантии — только из KB.",
    ].join("\n\n");

    const { args } = await geminiForcedFunctionCall({
      model: geminiFlashModel(),
      functionName: "build_rsya_offers",
      functionDescription: "Генерация текстовых офферов для РСЯ Яндекс Директа.",
      parameters: FORGE_RSYA_OFFERS_SCHEMA,
      systemInstruction: rsyaOffersSystemInstruction(),
      userParts: [{ text: userText }],
      temperature: 0.75,
      maxOutputTokens: 12000,
    });

    return ok(args);
  } catch (e) {
    console.error("forge-generate-rsya-offers error", e);
    return ok({ error: e instanceof Error ? e.message : "unknown error" }, 500);
  }
});
