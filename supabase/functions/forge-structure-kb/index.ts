/**
 * Разбор загруженных текстов (PDF, брифы, отзывы) → структура Knowledge Base.
 * JWT + is_forge_staff.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { geminiForcedFunctionCall, geminiFlashModel } from "../_shared/gemini.ts";
import {
  FORGE_KB_STRUCTURE_SCHEMA,
  calcKbCompletion,
  mergeForgeKb,
  type ForgeKbStructureResult,
} from "../_shared/forgeKbStructureSchema.ts";
import {
  fetchReferenceSitesForKb,
  REFERENCE_SITES_SYSTEM_RULES,
  type ReferenceSiteInput,
} from "../_shared/forgeReferenceSites.ts";
import {
  structuredToDirectionOverlay,
  upsertDirectionRow,
  type DirectionRow,
} from "../_shared/forgeDirections.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_SOURCE_CHARS = 120_000;
const MAX_SINGLE_DOC = 40_000;

function ok(payload: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type SourceInput = { filename?: string; text: string };

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
    const { product_id, sources, paste_text, product_name, reference_sites, direction_slug, direction_title } =
      body ?? {};
    if (!product_id) return ok({ error: "product_id required" }, { status: 400 });

    const directionSlug =
      direction_slug && String(direction_slug).trim() ? String(direction_slug).trim().slice(0, 48) : null;
    const directionTitle = direction_title ? String(direction_title).trim().slice(0, 120) : directionSlug;

    const incoming: SourceInput[] = [];
    if (Array.isArray(sources)) {
      for (const s of sources) {
        const text = String(s?.text ?? "").trim();
        if (!text) continue;
        incoming.push({
          filename: s?.filename ? String(s.filename).slice(0, 200) : "document",
          text: text.slice(0, MAX_SINGLE_DOC),
        });
      }
    }
    if (paste_text && String(paste_text).trim()) {
      incoming.push({
        filename: "paste.txt",
        text: String(paste_text).trim().slice(0, MAX_SINGLE_DOC),
      });
    }

    const refInputs = (Array.isArray(reference_sites) ? reference_sites : []) as ReferenceSiteInput[];
    const { records: newReferences, promptBlock: referencePrompt, errors: refErrors } =
      refInputs.length > 0
        ? await fetchReferenceSitesForKb(refInputs)
        : { records: [], promptBlock: "", errors: [] as string[] };

    if (!incoming.length && !newReferences.length) {
      return ok({ error: "sources, paste_text or reference_sites required" }, { status: 400 });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: staffOk } = await admin.rpc("is_forge_staff", { uid: auth.user.id });
    if (!staffOk) return ok({ error: "forbidden" }, { status: 403 });

    const { data: kbRow, error: kbErr } = await admin
      .from("forge_knowledge_base")
      .select("*")
      .eq("product_id", product_id)
      .maybeSingle();
    if (kbErr || !kbRow) return ok({ error: "kb not found" }, { status: 404 });

    const { data: productRow } = await admin
      .from("forge_products")
      .select("name")
      .eq("id", product_id)
      .maybeSingle();

    const combinedText = [
      incoming
        .map((s, i) => `--- ДОКУМЕНТ ${i + 1}: ${s.filename} ---\n${s.text}`)
        .join("\n\n"),
      referencePrompt,
    ]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, MAX_SOURCE_CHARS);

    const existingSummary = JSON.stringify(
      {
        product: kbRow.product,
        audience: kbRow.audience,
        usp: kbRow.usp,
        pains_count: (kbRow.pains as unknown[])?.length ?? 0,
      },
      null,
      0,
    ).slice(0, 2000);

    const directionHint = directionSlug
      ? `\n\nНАПРАВЛЕНИЕ ЛЕНДИНГА: «${directionTitle}» (slug: ${directionSlug}). ` +
        "Извлеки боли, аудиторию, УТП и VOC именно для этого направления. " +
        "Общие свойства бренда/продукта — только если явно есть в тексте.\n"
      : "\n\nОбщая база продукта (все направления). Заполни продукт, механизм, тон, СДВ.\n";

    const { args } = await geminiForcedFunctionCall({
      model: geminiFlashModel(),
      functionName: "structure_product_kb",
      functionDescription:
        "Извлекает структурированную базу знаний продукта из исходных материалов для генерации лендингов.",
      parameters: FORGE_KB_STRUCTURE_SCHEMA,
      systemInstruction:
        "Ты — CRO-маркетолог и копирайтер. Из материалов клиента извлеки базу знаний для прототипа сайта.\n" +
        "Правила:\n" +
        "- Пиши на русском, конкретно, без воды.\n" +
        "- pains: 5–12 болей с weight 1–10 по силе.\n" +
        "- voc: дословные фразы клиентов (10–25 шт), в кавычках не нужно.\n" +
        "- fab_matrix: 4–8 строк свойство→преимущество→выгода.\n" +
        "- objections: типичные сомнения + короткий ответ.\n" +
        "- proofs: кейсы, цифры, исследования — type: case|metric|media.\n" +
        "- review_snippets: если в тексте есть отзывы — вынеси отдельно (до 30).\n" +
        "- Не выдумывай факты, которых нет в материалах.\n" +
        REFERENCE_SITES_SYSTEM_RULES,
      userParts: [
        {
          text:
            `Продукт: ${product_name ?? productRow?.name ?? "не указан"}` +
            directionHint +
            `\nУже заполнено (дополни, не дублируй): ${existingSummary}\n\n` +
            `ИСХОДНИКИ:\n${combinedText}`,
        },
      ],
      temperature: 0.25,
    });

    const structured = (args ?? {}) as ForgeKbStructureResult;

    let merged: Record<string, unknown>;
    let directions = (kbRow.directions as DirectionRow[]) ?? [];

    if (directionSlug) {
      const overlay = structuredToDirectionOverlay(structured as Record<string, unknown>);
      directions = upsertDirectionRow(
        directions,
        directionSlug,
        directionTitle ?? directionSlug,
        overlay,
      );
      merged = mergeForgeKb(kbRow as Record<string, unknown>, {
        ...structured,
        pains: kbRow.pains,
        voc: kbRow.voc,
        audience: kbRow.audience,
        usp: kbRow.usp,
        objections: kbRow.objections,
        proofs: kbRow.proofs,
      });
    } else {
      merged = mergeForgeKb(kbRow as Record<string, unknown>, structured);
    }

    const completion = calcKbCompletion(merged);

    const now = new Date().toISOString();
    const prevDocs = (kbRow.source_documents as unknown[]) ?? [];
    const newDocs = incoming.map((s) => ({
      id: crypto.randomUUID(),
      filename: s.filename,
      text: s.text.slice(0, MAX_SINGLE_DOC),
      char_count: s.text.length,
      uploaded_at: now,
      direction_slug: directionSlug,
    }));
    const taggedRefs = newReferences.map((r) => ({ ...r, direction_slug: directionSlug }));
    const source_documents = [...prevDocs, ...newDocs].slice(-20);
    const prevRefs = (kbRow.reference_sites as unknown[]) ?? [];
    const reference_sites_merged = [...prevRefs, ...taggedRefs].slice(-12);

    const { data: updated, error: updErr } = await admin
      .from("forge_knowledge_base")
      .update({
        product: merged.product,
        audience: merged.audience,
        usp: merged.usp,
        pains: merged.pains,
        voc: merged.voc,
        fab_matrix: merged.fab_matrix,
        objections: merged.objections,
        proofs: merged.proofs,
        tone: merged.tone,
        source_documents,
        reference_sites: reference_sites_merged,
        directions,
        completion_percent: completion,
        updated_at: now,
      })
      .eq("product_id", product_id)
      .select("*")
      .single();

    if (updErr) {
      console.error("forge-structure-kb update failed", updErr);
      return ok({ error: updErr.message }, { status: 500 });
    }

    let reviews_inserted = 0;
    const snippets = structured.review_snippets ?? [];
    if (snippets.length) {
      const rows = snippets
        .map((r) => ({
          product_id,
          text: String(r.text ?? "").trim().slice(0, 4000),
          author: r.author ? String(r.author).slice(0, 200) : null,
          rating: Number.isFinite(r.rating) ? Number(r.rating) : null,
          source: "import:kb",
          tags: [] as string[],
        }))
        .filter((r) => r.text.length > 0)
        .slice(0, 50);
      if (rows.length) {
        const { data: ins } = await admin.from("forge_reviews").insert(rows).select("id");
        reviews_inserted = ins?.length ?? 0;
      }
    }

    return ok({
      kb: updated,
      completion_percent: completion,
      sources_added: newDocs.length,
      references_added: newReferences.length,
      reference_errors: refErrors,
      reviews_inserted,
    });
  } catch (e) {
    console.error("forge-structure-kb error", e);
    return ok({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
});
