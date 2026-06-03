import { supabase } from "@/integrations/supabase/client";

export type HypothesisStatus =
  | "new"
  | "selected"
  | "in_progress"
  | "implemented"
  | "rejected"
  | "tested"
  | "won"
  | "lost";

export type Hypothesis = {
  id: string;
  project_id: string;
  commercial_metric_id: string | null;
  source_type: string | null;
  title: string;
  description: string | null;
  type: string;
  priority: "high" | "medium" | "low";
  status: HypothesisStatus;
  what_to_change: string | null;
  why: string | null;
  expected_impact: string | null;
  implementation_difficulty: string | null;
  example_copy: string | null;
  /** CR before implementation (stored in description field if not persisted separately) */
  cr_before?: string | null;
  /** CR after implementation */
  cr_after?: string | null;
  /** Free-text result description */
  result_note?: string | null;
  created_at: string;
  updated_at: string;
};

export type HypothesisDecision = "scale" | "pivot" | "stop";

export type HypothesisMeta = {
  crBefore?: string;
  crAfter?: string;
  resultNote?: string;
  decision?: HypothesisDecision;
  insight?: string;
  nextAction?: string;
  metricName?: string;
  testWindow?: string;
  owner?: string;
  source?: string;
  guardrail?: string;
};

export async function listHypothesesForProject(projectId: string): Promise<Hypothesis[]> {
  const { data, error } = await supabase
    .from("hypotheses")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Hypothesis[];
}

export async function createHypothesis(input: {
  projectId: string;
  title: string;
  description?: string;
  expectedImpact?: string;
  whatToChange?: string;
  sourceType?: string;
  hypothesisType?: string;
  priority?: "high" | "medium" | "low";
  status?: HypothesisStatus;
  commercialMetricId?: string;
}): Promise<Hypothesis> {
  const { data, error } = await supabase
    .from("hypotheses")
    .insert({
      project_id: input.projectId,
      commercial_metric_id: input.commercialMetricId ?? null,
      title: input.title,
      description: input.description ?? null,
      expected_impact: input.expectedImpact ?? null,
      what_to_change: input.whatToChange ?? null,
      source_type: input.sourceType ?? "manual",
      status: input.status ?? "selected",
      priority: input.priority ?? "high",
      type: input.hypothesisType ?? "offer",
      why: input.description ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Hypothesis;
}

export async function updateHypothesisStatus(
  id: string,
  status: HypothesisStatus,
  extra?: HypothesisMeta,
): Promise<void> {
  const patch: Record<string, unknown> = { status };

  if (extra) {
    patch.implementation_difficulty = encodeHypothesisMeta(extra);
  }

  const { error } = await supabase.from("hypotheses").update(patch).eq("id", id);
  if (error) throw error;
}

export async function selectHypothesesForTracking(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase
    .from("hypotheses")
    .update({ status: "selected" })
    .in("id", ids);
  if (error) throw error;
}

export async function saveHypothesisMethodology(
  id: string,
  meta: Pick<HypothesisMeta, "metricName" | "testWindow" | "source" | "guardrail" | "owner">,
  extra?: { hypothesisType?: string; sourceType?: string; commercialMetricId?: string },
): Promise<void> {
  const patch: Record<string, unknown> = {
    implementation_difficulty: encodeHypothesisMeta(meta),
  };
  if (extra?.hypothesisType) patch.type = extra.hypothesisType;
  if (extra?.sourceType) patch.source_type = extra.sourceType;
  if (extra?.commercialMetricId) patch.commercial_metric_id = extra.commercialMetricId;
  const { error } = await supabase.from("hypotheses").update(patch).eq("id", id);
  if (error) throw error;
}

/** Parse result fields stored in implementation_difficulty */
export function parseHypothesisResult(h: Hypothesis): {
  crBefore: string | null;
  crAfter: string | null;
  resultNote: string | null;
  liftPercent: number | null;
  decision: HypothesisDecision | null;
  insight: string | null;
  nextAction: string | null;
  metricName: string | null;
  testWindow: string | null;
  owner: string | null;
  source: string | null;
  guardrail: string | null;
} {
  const meta = decodeHypothesisMeta(h.implementation_difficulty);
  const crBefore = meta.crBefore ?? null;
  const crAfter = meta.crAfter ?? null;
  const resultNote = meta.resultNote ?? null;

  let liftPercent: number | null = null;
  if (crBefore && crAfter) {
    const before = parseFloat(crBefore.replace(",", ".").replace("%", ""));
    const after = parseFloat(crAfter.replace(",", ".").replace("%", ""));
    if (!isNaN(before) && !isNaN(after) && before > 0) {
      liftPercent = Math.round(((after - before) / before) * 100);
    }
  }

  return {
    crBefore,
    crAfter,
    resultNote,
    liftPercent,
    decision: meta.decision ?? null,
    insight: meta.insight ?? null,
    nextAction: meta.nextAction ?? null,
    metricName: meta.metricName ?? null,
    testWindow: meta.testWindow ?? null,
    owner: meta.owner ?? null,
    source: meta.source ?? null,
    guardrail: meta.guardrail ?? null,
  };
}

function encodeHypothesisMeta(meta: HypothesisMeta): string {
  const parts: string[] = [];
  if (meta.crBefore?.trim()) parts.push(`cr_before:${meta.crBefore.trim()}`);
  if (meta.crAfter?.trim()) parts.push(`cr_after:${meta.crAfter.trim()}`);
  if (meta.resultNote?.trim()) parts.push(`result:${meta.resultNote.trim()}`);
  if (meta.decision?.trim()) parts.push(`decision:${meta.decision.trim()}`);
  if (meta.insight?.trim()) parts.push(`insight:${meta.insight.trim()}`);
  if (meta.nextAction?.trim()) parts.push(`next:${meta.nextAction.trim()}`);
  if (meta.metricName?.trim()) parts.push(`metric:${meta.metricName.trim()}`);
  if (meta.testWindow?.trim()) parts.push(`window:${meta.testWindow.trim()}`);
  if (meta.owner?.trim()) parts.push(`owner:${meta.owner.trim()}`);
  if (meta.source?.trim()) parts.push(`source:${meta.source.trim()}`);
  if (meta.guardrail?.trim()) parts.push(`guardrail:${meta.guardrail.trim()}`);
  return parts.join("|");
}

function decodeHypothesisMeta(raw: string | null): HypothesisMeta {
  if (!raw) return {};
  const parts = raw.split("|");
  const find = (key: string) => {
    const p = parts.find((x) => x.startsWith(`${key}:`));
    return p ? p.slice(key.length + 1).trim() : undefined;
  };
  const decisionRaw = find("decision");
  const decision =
    decisionRaw === "scale" || decisionRaw === "pivot" || decisionRaw === "stop"
      ? decisionRaw
      : undefined;
  return {
    crBefore: find("cr_before"),
    crAfter: find("cr_after"),
    resultNote: find("result"),
    decision,
    insight: find("insight"),
    nextAction: find("next"),
    metricName: find("metric"),
    testWindow: find("window"),
    owner: find("owner"),
    source: find("source"),
    guardrail: find("guardrail"),
  };
}
