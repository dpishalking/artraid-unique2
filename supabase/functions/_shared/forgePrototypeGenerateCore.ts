/**
 * Общая генерация прототипа Forge (staff Lab + public Studio).
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { geminiForcedFunctionCall, geminiProModel } from "./gemini.ts";
import { buildClipReferencePrompt } from "./forgeClipReference.ts";
import {
  applyClipStepFixes,
  buildClipUserPromptParts,
  buildRegenerateFreshBlock,
  mergePromptConfigs,
  resolveClipSystemPrompt,
  summarizePromptsApplied,
  type ForgeGenerationPromptConfig,
} from "./forgeGenerationPrompts.ts";
import { buildForgeKbPromptSection, type ForgeKbRow } from "./forgeKbPrompt.ts";
import { buildEffectiveKbRow } from "./forgeDirections.ts";
import { generateForgeFullPrototype } from "./forgeFullGenerate.ts";
import { getScenarioById } from "./landingScenarios.ts";
import { normalizeIncludedMiddleBlocks } from "./fullLandingBlocks.ts";
import {
  applyClipStepBlockFilter,
  buildClipSchemaForBlocks,
  buildClipStepBlocksPromptSection,
  normalizeClipStepBlocks,
} from "./clipLandingBlocks.ts";
import { ensureUniquePrototypeSlug } from "./forgeStudioPortal.ts";

export type RunForgeGenerateParams = {
  admin: SupabaseClient;
  product_id: string;
  template_id: string;
  scenario_id?: string | null;
  name: string;
  notes?: string | null;
  direction_slug?: string | null;
  format?: string | null;
  prototype_id?: string | null;
  regenerate_fresh?: boolean;
  variation_note?: string | null;
  included_blocks?: string[] | null;
  clip_step_blocks?: Partial<Record<string, string[]>> | null;
  created_by?: string | null;
  studio_portal_id?: string | null;
  auto_publish?: boolean;
};

export type RunForgeGenerateResult = {
  prototype_id: string;
  version_id: string;
  version: number;
  slug?: string;
};

export async function runForgePrototypeGeneration(
  params: RunForgeGenerateParams,
): Promise<RunForgeGenerateResult> {
  const {
    admin,
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
    created_by,
    studio_portal_id,
    auto_publish,
  } = params;

  const regenerateFresh = regenerate_fresh === true;
  const variationNote =
    typeof variation_note === "string" && variation_note.trim()
      ? variation_note.trim().slice(0, 2000)
      : null;

  const [{ data: kbRow }, { data: reviews }, { data: productRow }, { data: globalSettingsRow }] =
    await Promise.all([
      admin.from("forge_knowledge_base").select("*").eq("product_id", product_id).maybeSingle(),
      admin
        .from("forge_reviews")
        .select("text,author,rating,tags,is_starred")
        .eq("product_id", product_id)
        .order("is_starred", { ascending: false })
        .limit(30),
      admin.from("forge_products").select("generation_prompts").eq("id", product_id).maybeSingle(),
      admin.from("forge_lab_settings").select("value").eq("key", "generation_prompts").maybeSingle(),
    ]);

  if (!kbRow) throw new Error("knowledge base not found");

  const promptsConfig = mergePromptConfigs(
    (globalSettingsRow?.value ?? {}) as ForgeGenerationPromptConfig,
    (productRow?.generation_prompts ?? {}) as ForgeGenerationPromptConfig,
  );

  const directionSlug =
    direction_slug && String(direction_slug).trim() ? String(direction_slug).trim().slice(0, 48) : null;
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
  const kbSection = buildForgeKbPromptSection(effectiveKb, relevantReviews as never[]);

  const scenario = scenario_id ? getScenarioById(scenario_id) : null;
  const scenarioSection = scenario
    ? [
        "## ВЫБРАННЫЙ СЦЕНАРИЙ ТРАФИКА",
        `Название: ${scenario.title}`,
        `Цель: ${scenario.goal}`,
        `Логика: ${scenario.logic}`,
        `CTA: ${scenario.primaryCTA}`,
        `Стиль: ${scenario.copywritingStyle}`,
      ].join("\n")
    : "";

  let prototypeId: string | null = null;
  let previousContent: Record<string, unknown> | null = null;

  if (bodyPrototypeId && String(bodyPrototypeId).trim()) {
    const pid = String(bodyPrototypeId).trim();
    const { data: existingProto, error: protoErr } = await admin
      .from("forge_prototypes")
      .select("id, product_id, active_version_id")
      .eq("id", pid)
      .maybeSingle();
    if (protoErr) throw protoErr;
    if (!existingProto || existingProto.product_id !== product_id) {
      throw new Error("prototype not found for product");
    }
    prototypeId = existingProto.id as string;
    if (regenerateFresh && existingProto.active_version_id) {
      const { data: prevVer } = await admin
        .from("forge_prototype_versions")
        .select("content")
        .eq("id", existingProto.active_version_id)
        .maybeSingle();
      previousContent = (prevVer?.content ?? null) as Record<string, unknown> | null;
    }
  }

  const regenerateFreshBlock = regenerateFresh
    ? buildRegenerateFreshBlock(previousContent, variationNote)
    : variationNote
      ? buildRegenerateFreshBlock(null, variationNote)
      : "";

  let content: Record<string, unknown>;
  let generationInput: Record<string, unknown>;
  const clipTemperature = regenerateFresh ? 0.88 : 0.7;

  if (template_id === "clip-4") {
    const clipStepBlocks = normalizeClipStepBlocks(clip_step_blocks);
    const clipReference = buildClipReferencePrompt(effectiveKb);
    const userText = buildClipUserPromptParts({
      kbSection,
      clipReference: clipReference.prompt,
      scenarioSection,
      directionSlug,
      config: promptsConfig,
      regenerateFreshBlock,
      clipStepBlocksPrompt: buildClipStepBlocksPromptSection(clipStepBlocks),
    });

    const { args } = await geminiForcedFunctionCall({
      model: geminiProModel(),
      functionName: "build_clip_landing",
      functionDescription: "Сборка клип-лендинга из 4 страниц.",
      parameters: buildClipSchemaForBlocks(clipStepBlocks),
      systemInstruction: resolveClipSystemPrompt(promptsConfig, {
        hasUserReferences: clipReference.hasUserReferences,
      }),
      userParts: [{ text: userText }],
      temperature: clipTemperature,
    });

    content = applyClipStepFixes(args as Record<string, unknown>, promptsConfig);
    content = applyClipStepBlockFilter(content, clipStepBlocks);
    generationInput = {
      template_id,
      scenario_id,
      direction_slug: directionSlug,
      clip_step_blocks: clipStepBlocks,
      kb_size: userText.length,
      prompts_applied: summarizePromptsApplied(promptsConfig),
      regenerate_fresh: regenerateFresh,
      variation_note: variationNote,
      studio_portal_id: studio_portal_id ?? null,
    };
  } else if (template_id === "full") {
    const fmt = typeof format === "string" && format.trim() ? format.trim().slice(0, 24) : null;
    const includedMiddleBlocks =
      Array.isArray(included_blocks) && included_blocks.length
        ? normalizeIncludedMiddleBlocks(included_blocks)
        : null;
    content = await generateForgeFullPrototype({
      kbSection,
      kb: effectiveKb,
      projectName: name,
      scenario,
      directionSlug,
      scenarioId: scenario_id ?? null,
      format: fmt,
      promptsConfig,
      regenerateFresh,
      previousContent,
      variationNote,
      includedMiddleBlocks: includedMiddleBlocks ?? undefined,
    });
    generationInput = {
      template_id,
      scenario_id,
      direction_slug: directionSlug,
      format: fmt,
      included_blocks: includedMiddleBlocks,
      kb_size: kbSection.length,
      pipeline: "generate-prototype-shared",
      prompts_applied: summarizePromptsApplied(promptsConfig),
      regenerate_fresh: regenerateFresh,
      variation_note: variationNote,
      studio_portal_id: studio_portal_id ?? null,
    };
  } else {
    throw new Error("unknown template");
  }

  if (!prototypeId) {
    const { data: existingByName } = await admin
      .from("forge_prototypes")
      .select("id")
      .eq("product_id", product_id)
      .eq("name", name)
      .maybeSingle();

    if (existingByName?.id) {
      prototypeId = existingByName.id;
    } else {
      const { data: created, error: createErr } = await admin
        .from("forge_prototypes")
        .insert({
          product_id,
          template_id,
          scenario_id: scenario_id ?? null,
          direction_slug: directionSlug,
          name,
          created_by: created_by ?? null,
          studio_portal_id: studio_portal_id ?? null,
        })
        .select("id")
        .single();
      if (createErr) throw createErr;
      prototypeId = created.id;
    }
  }

  const { data: lastVer } = await admin
    .from("forge_prototype_versions")
    .select("version")
    .eq("prototype_id", prototypeId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = ((lastVer?.version as number | undefined) ?? 0) + 1;

  const { data: ver, error: verErr } = await admin
    .from("forge_prototype_versions")
    .insert({
      prototype_id: prototypeId,
      version: nextVersion,
      content,
      generation_input: generationInput,
      notes: notes ?? null,
      created_by: created_by ?? null,
    })
    .select("id")
    .single();
  if (verErr) throw verErr;

  let slug: string | undefined;
  const protoUpdate: Record<string, unknown> = {
    active_version_id: ver.id,
    direction_slug: directionSlug,
  };

  if (auto_publish) {
    slug = await ensureUniquePrototypeSlug(admin, name);
    protoUpdate.slug = slug;
    protoUpdate.status = "published";
    protoUpdate.published_at = new Date().toISOString();
  }

  await admin.from("forge_prototypes").update(protoUpdate).eq("id", prototypeId);

  return {
    prototype_id: prototypeId,
    version_id: ver.id,
    version: nextVersion,
    slug,
  };
}
