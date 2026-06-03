import { supabase } from "@/integrations/supabase/client";
import type { OfferBrief } from "@/lib/offer-generator/types";
import {
  mapOfferBriefToProjectContext,
  mapOfferBriefToProjectMemory,
} from "@/lib/offer-generator/mapOfferBriefToMemory";
import { rowToResolvedMemory } from "./api";
import {
  calculateProjectMemoryCompletionPct,
  evaluateAutoBadges,
  levelSlugFromCompletion,
  mergeBadges,
} from "./completion";
import { mergeStoredMemoryIntoSections } from "./mergeSections";
import type { ProjectMemorySections } from "./types";

type DbMemoryRow = Record<string, unknown>;

const MEMORY_JSON_COLS = [
  "company",
  "founder",
  "product",
  "audience",
  "pains_desires",
  "offer_positioning",
  "websites",
  "competitors",
  "proofs",
  "objections",
  "pricing",
  "business_metrics",
  "tone",
  "constraints",
] as const satisfies ReadonlyArray<keyof ProjectMemorySections>;

function cloneSections(s: ProjectMemorySections): ProjectMemorySections {
  return JSON.parse(JSON.stringify(s)) as ProjectMemorySections;
}

function isEmptyStoredScalar(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return !v.trim();
  return false;
}

function normalizedEquals(a: unknown, b: unknown): boolean {
  if (typeof a === "string" && typeof b === "string") {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

function toJsonSafe(val: unknown) {
  if (val === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch {
    return null;
  }
}

function hasBriefContent(brief: OfferBrief): boolean {
  return Boolean(
    brief.productDescription.trim() ||
      brief.targetAudience.trim() ||
      brief.customerSituation.trim() ||
      brief.painPoint.trim() ||
      brief.promisedResult.trim() ||
      brief.proof.trim() ||
      brief.objections.trim(),
  );
}

export type OfferBriefSyncResult = {
  fieldsFilled: string[];
  conflictsRaised: number;
  completion_percent: number;
};

/** Переносит ответы брифа оффера в память проекта и контекст. */
export async function syncOfferBriefToProjectMemory(
  projectId: string,
  brief: OfferBrief,
): Promise<OfferBriefSyncResult> {
  if (!hasBriefContent(brief)) {
    return { fieldsFilled: [], conflictsRaised: 0, completion_percent: 0 };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: memRowRaw, error: mErr } = await supabase
    .from("project_memories")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (mErr) throw mErr;

  let currentDb: DbMemoryRow;
  if (!memRowRaw) {
    const ins = await supabase
      .from("project_memories")
      .insert({ project_id: projectId })
      .select("*")
      .single();
    if (ins.error) throw ins.error;
    currentDb = ins.data as DbMemoryRow;
  } else {
    currentDb = memRowRaw as DbMemoryRow;
  }

  const next = cloneSections(mergeStoredMemoryIntoSections(currentDb));
  const patch = mapOfferBriefToProjectMemory(brief);
  const fieldsFilled: string[] = [];
  let conflictsRaised = 0;

  async function pendingSuggestionExists(section: string, field: string): Promise<boolean> {
    const { data } = await supabase
      .from("project_memory_updates")
      .select("id")
      .eq("project_id", projectId)
      .eq("status", "pending")
      .eq("source_type", "offer_brief_sync")
      .eq("section", section)
      .eq("field", field)
      .maybeSingle();
    return Boolean(data?.id);
  }

  async function raiseConflict(section: string, field: string, oldVal: unknown, suggested: unknown) {
    if (!user?.id) {
      conflictsRaised += 1;
      return;
    }
    if (await pendingSuggestionExists(section, field)) return;
    conflictsRaised += 1;
    const { error } = await supabase.from("project_memory_updates").insert({
      project_id: projectId,
      source_type: "offer_brief_sync",
      source_id: "offer_generator_brief",
      section,
      field,
      old_value: toJsonSafe(oldVal),
      suggested_value: toJsonSafe(suggested) ?? {},
      status: "pending",
    });
    if (error) console.warn("offer_brief_sync memory update:", error.message);
  }

  function fillScalar(section: keyof ProjectMemorySections, field: string, value: unknown) {
    if (value == null) return;
    if (typeof value === "string" && !value.trim()) return;

    const sec = next[section];
    if (!sec || typeof sec !== "object" || Array.isArray(sec)) return;
    const rec = sec as Record<string, unknown>;
    const cur = rec[field];

    if (isEmptyStoredScalar(cur)) {
      rec[field] = value;
      fieldsFilled.push(`${section}.${field}`);
      return;
    }

    if (normalizedEquals(cur, value)) return;
    void raiseConflict(section, field, cur, value);
  }

  for (const [section, branch] of Object.entries(patch)) {
    if (!branch || typeof branch !== "object" || Array.isArray(branch)) continue;
    for (const [field, value] of Object.entries(branch as Record<string, unknown>)) {
      fillScalar(section as keyof ProjectMemorySections, field, value);
    }
  }

  const pct = calculateProjectMemoryCompletionPct(next);
  const level = levelSlugFromCompletion(pct);
  const prevBadges = Array.isArray(currentDb.badges)
    ? (currentDb.badges as string[]).map(String)
    : [];
  const auto = evaluateAutoBadges(pct, next);
  const { badges } = mergeBadges(prevBadges, auto);

  const memPatch: Record<string, unknown> = {
    completion_percent: pct,
    completion_level: level,
    badges,
  };
  for (const col of MEMORY_JSON_COLS) {
    memPatch[col as string] = next[col];
  }

  const { error: uErr } = await supabase
    .from("project_memories")
    .update(memPatch)
    .eq("project_id", projectId);
  if (uErr) throw uErr;

  await syncProjectContextFromOfferBrief(projectId, brief);

  if (user?.id && fieldsFilled.length > 0) {
    await supabase.from("project_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "project_memory_updated_from_offer_brief",
      title: "Память проекта пополнена из брифа оффера",
      description: `Обновлено полей: ${fieldsFilled.length}.`,
      metadata: { fields_filled: fieldsFilled, source: "offer_brief_sync" },
    });
  }

  rowToResolvedMemory({ ...currentDb, ...memPatch, project_id: projectId });

  return {
    fieldsFilled,
    conflictsRaised,
    completion_percent: pct,
  };
}

async function syncProjectContextFromOfferBrief(projectId: string, brief: OfferBrief) {
  const ctxPatch = mapOfferBriefToProjectContext(brief);
  if (Object.keys(ctxPatch).length === 0) return;

  const { data: ctxRow } = await supabase
    .from("project_contexts")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  const projectPatch: Record<string, unknown> = {};
  const { data: projectRow } = await supabase
    .from("projects")
    .select("product_description, target_audience, additional_context")
    .eq("id", projectId)
    .maybeSingle();

  const proj = (projectRow ?? {}) as Record<string, unknown>;
  if (ctxPatch.product_description && isEmptyStoredScalar(proj.product_description)) {
    projectPatch.product_description = ctxPatch.product_description;
  }
  if (ctxPatch.target_audience && isEmptyStoredScalar(proj.target_audience)) {
    projectPatch.target_audience = ctxPatch.target_audience;
  }
  if (ctxPatch.important_notes && isEmptyStoredScalar(proj.additional_context)) {
    projectPatch.additional_context = ctxPatch.important_notes;
  }

  if (Object.keys(projectPatch).length > 0) {
    await supabase
      .from("projects")
      .update({ ...projectPatch, last_activity_at: new Date().toISOString() })
      .eq("id", projectId);
  }

  if (!ctxRow) {
    await supabase.from("project_contexts").insert({
      project_id: projectId,
      ...ctxPatch,
    });
    return;
  }

  const update: Record<string, unknown> = {};
  const row = ctxRow as Record<string, unknown>;

  for (const [key, value] of Object.entries(ctxPatch)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      const cur = row[key];
      if (Array.isArray(cur) && cur.length > 0) continue;
      update[key] = value;
      continue;
    }
    if (typeof value === "string") {
      const cur = row[key];
      if (typeof cur === "string" && cur.trim()) continue;
      update[key] = value;
    }
  }

  if (Object.keys(update).length > 0) {
    await supabase.from("project_contexts").update(update).eq("project_id", projectId);
  }
}
