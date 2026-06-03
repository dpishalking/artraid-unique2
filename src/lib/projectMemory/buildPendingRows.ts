import type { BriefAnswers } from "@/lib/projects/briefStorage";
import { mapBriefAnswersToMemory } from "@/lib/projects/briefStorage";
import { mainGoalLabel } from "@/lib/projects/constants";
import type { Project } from "@/lib/projects/types";
import type { ProjectMemorySections } from "./types";

const SCALAR_SECTIONS = new Set([
  "company",
  "founder",
  "product",
  "audience",
  "pains_desires",
  "offer_positioning",
  "websites",
  "proofs",
  "pricing",
  "business_metrics",
  "tone",
  "constraints",
]);

function isFilledValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => typeof item === "string" && item.trim().length > 0);
  return false;
}

export function flattenMemoryPatch(
  patch: Partial<ProjectMemorySections>,
): Array<{ section: string; field: string; value: unknown }> {
  const out: Array<{ section: string; field: string; value: unknown }> = [];

  for (const [section, branch] of Object.entries(patch)) {
    if (!SCALAR_SECTIONS.has(section) || !branch || typeof branch !== "object" || Array.isArray(branch)) continue;
    for (const [field, value] of Object.entries(branch as Record<string, unknown>)) {
      if (typeof value === "string" && !value.trim()) continue;
      if (Array.isArray(value) && !value.length) continue;
      if (value == null) continue;
      out.push({ section, field, value });
    }
  }

  return out;
}

export function buildPendingMemoryRows(
  projectId: string,
  sourceType: string,
  sourceId: string,
  extracted: Array<{ section: string; field: string; value: unknown }>,
  currentMemory: ProjectMemorySections,
  options?: { fillEmptyOnly?: boolean },
): Record<string, unknown>[] {
  const fillEmptyOnly = options?.fillEmptyOnly !== false;
  const rows: Record<string, unknown>[] = [];

  for (const item of extracted) {
    if (!SCALAR_SECTIONS.has(item.section)) continue;
    const branch = currentMemory[item.section as keyof ProjectMemorySections];
    const currentField =
      branch && typeof branch === "object" && !Array.isArray(branch)
        ? (branch as Record<string, unknown>)[item.field]
        : undefined;

    if (fillEmptyOnly && isFilledValue(currentField)) continue;

    rows.push({
      project_id: projectId,
      source_type: sourceType,
      source_id: sourceId,
      section: item.section,
      field: item.field,
      old_value: currentField ?? null,
      suggested_value: item.value,
      status: "pending",
    });
  }

  return rows;
}

export function resolveBriefAnswers(project: Project, snapshot: Record<string, unknown> | null): BriefAnswers | null {
  const snap = snapshot ?? {};

  const briefKeys = [
    "product_name",
    "product_description",
    "target_audience",
    "main_pain",
    "current_offer",
  ] as const;
  const hasBriefShape = briefKeys.some((key) => typeof snap[key] === "string" && String(snap[key]).trim());

  if (hasBriefShape) {
    return snap as BriefAnswers;
  }

  if (typeof snap.productDescription === "string" && snap.productDescription.trim()) {
    return {
      product_description: String(snap.productDescription),
      target_audience: typeof snap.targetAudience === "string" ? snap.targetAudience : project.target_audience,
      main_goal: typeof snap.mainGoal === "string" ? snap.mainGoal : project.main_goal,
      website: typeof snap.website === "string" ? snap.website : project.current_website_url ?? undefined,
    };
  }

  if (project.product_description?.trim()) {
    return {
      product_name: project.product_name ?? undefined,
      product_description: project.product_description,
      target_audience: project.target_audience,
      main_goal: project.main_goal,
      website: project.current_website_url ?? undefined,
      current_offer: project.current_offer ?? undefined,
    };
  }

  return null;
}

export function memoryPatchFromBriefAnswers(answers: BriefAnswers): Partial<ProjectMemorySections> {
  const patch = mapBriefAnswersToMemory(answers);
  if (answers.main_goal?.trim()) {
    patch.business_metrics = {
      ...patch.business_metrics,
      business_goal: mainGoalLabel(answers.main_goal),
    };
  }
  return patch;
}

export function countBriefFieldsAvailable(answers: BriefAnswers): number {
  return flattenMemoryPatch(memoryPatchFromBriefAnswers(answers)).length;
}
