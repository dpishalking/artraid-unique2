import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getCommercialMetricsSnapshot } from "@/lib/commercial/api";
import type { CommercialMetric } from "@/lib/commercial/types";

export type ProjectPlanHorizon = "month" | "quarter" | "year" | "custom";

export type ProjectStrategyDraft = {
  title: string;
  rationale: string;
  whatToChange: string[];
  metricName?: string;
  commercialMetricId?: string | null;
  deadline?: string | null;
  priority: "high" | "medium" | "low";
  channel: "website" | "funnel" | "sales" | "offer" | "creative" | "research";
};

export type ProjectPlan = {
  id: string;
  project_id: string;
  goal: string | null;
  north_star_metric_id: string | null;
  horizon: ProjectPlanHorizon;
  deadline: string | null;
  focus: string | null;
  strategies: ProjectStrategyDraft[];
  created_at: string;
  updated_at: string;
};

export type ProjectPlanPatch = {
  goal?: string | null;
  northStarMetricId?: string | null;
  horizon?: ProjectPlanHorizon;
  deadline?: string | null;
  focus?: string | null;
  strategies?: ProjectStrategyDraft[];
};

export type ProjectPlanBundle = {
  plan: ProjectPlan | null;
  metrics: CommercialMetric[];
  northStarMetric: CommercialMetric | null;
  tableAvailable: boolean;
};

function isMissingProjectPlansTable(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : String(error ?? "");
  const low = msg.toLowerCase();
  return low.includes("project_plans") || low.includes("pgrst205") || low.includes("does not exist");
}

function parseStrategies(raw: Json | null | undefined): ProjectStrategyDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object" && !Array.isArray(x))
    .map((row) => {
      const priorityRaw = String(row.priority ?? "medium");
      const priority = priorityRaw === "high" || priorityRaw === "low" ? priorityRaw : "medium";
      const channelRaw = String(row.channel ?? "website");
      const channel = ["website", "funnel", "sales", "offer", "creative", "research"].includes(channelRaw)
        ? (channelRaw as ProjectStrategyDraft["channel"])
        : "website";
      return {
        title: String(row.title ?? "").trim(),
        rationale: String(row.rationale ?? "").trim(),
        whatToChange: Array.isArray(row.whatToChange)
          ? row.whatToChange.map(String).filter(Boolean)
          : Array.isArray(row.what_to_change)
            ? row.what_to_change.map(String).filter(Boolean)
            : [],
        metricName: row.metricName ? String(row.metricName) : row.metric_name ? String(row.metric_name) : undefined,
        commercialMetricId: row.commercialMetricId
          ? String(row.commercialMetricId)
          : row.commercial_metric_id
            ? String(row.commercial_metric_id)
            : null,
        deadline: row.deadline ? String(row.deadline) : null,
        priority,
        channel,
      };
    })
    .filter((s) => s.title.length >= 3);
}

function normalizePlan(row: Record<string, unknown>): ProjectPlan {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    goal: row.goal ? String(row.goal) : null,
    north_star_metric_id: row.north_star_metric_id ? String(row.north_star_metric_id) : null,
    horizon: ["month", "quarter", "year", "custom"].includes(String(row.horizon))
      ? (String(row.horizon) as ProjectPlanHorizon)
      : "month",
    deadline: row.deadline ? String(row.deadline) : null,
    focus: row.focus ? String(row.focus) : null,
    strategies: parseStrategies(row.strategies as Json),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function pickNorthStarMetric(
  metrics: CommercialMetric[],
  plan?: ProjectPlan | null,
): CommercialMetric | null {
  return (
    metrics.find((m) => m.id === plan?.north_star_metric_id) ??
    metrics.find((m) => m.slug === "north_star") ??
    metrics.find((m) => m.is_primary) ??
    metrics[0] ??
    null
  );
}

export async function getProjectPlanBundle(projectId: string): Promise<ProjectPlanBundle> {
  const metricsSnap = await getCommercialMetricsSnapshot(projectId);
  let plan: ProjectPlan | null = null;
  let tableAvailable = true;

  try {
    const { data, error } = await supabase
      .from("project_plans")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();
    if (error) throw error;
    plan = data ? normalizePlan(data as Record<string, unknown>) : null;
  } catch (e) {
    if (!isMissingProjectPlansTable(e)) throw e;
    tableAvailable = false;
  }

  return {
    plan,
    metrics: metricsSnap.metrics.filter((m) => !m.is_hidden),
    northStarMetric: pickNorthStarMetric(metricsSnap.metrics.filter((m) => !m.is_hidden), plan),
    tableAvailable,
  };
}

export async function saveProjectPlan(projectId: string, patch: ProjectPlanPatch): Promise<ProjectPlan> {
  const row = {
    project_id: projectId,
    ...(patch.goal !== undefined ? { goal: patch.goal?.trim() || null } : {}),
    ...(patch.northStarMetricId !== undefined ? { north_star_metric_id: patch.northStarMetricId || null } : {}),
    ...(patch.horizon !== undefined ? { horizon: patch.horizon } : {}),
    ...(patch.deadline !== undefined ? { deadline: patch.deadline || null } : {}),
    ...(patch.focus !== undefined ? { focus: patch.focus?.trim() || null } : {}),
    ...(patch.strategies !== undefined ? { strategies: patch.strategies as unknown as Json } : {}),
  };

  const { data, error } = await supabase
    .from("project_plans")
    .upsert(row, { onConflict: "project_id" })
    .select("*")
    .single();
  if (error) throw error;
  return normalizePlan(data as Record<string, unknown>);
}

export async function generateProjectStrategies(input: {
  projectId: string;
  goal: string;
  focus?: string | null;
  northStarMetric?: CommercialMetric | null;
  deadline?: string | null;
}): Promise<ProjectStrategyDraft[]> {
  const { data, error } = await supabase.functions.invoke<{
    strategies?: ProjectStrategyDraft[];
    error?: string;
  }>("generate-project-strategies", {
    body: {
      project_id: input.projectId,
      goal: input.goal,
      focus: input.focus,
      north_star_metric: input.northStarMetric
        ? {
            id: input.northStarMetric.id,
            name: input.northStarMetric.name,
            plan_value: input.northStarMetric.plan_value,
            fact_value: input.northStarMetric.fact_value,
            unit: input.northStarMetric.unit,
          }
        : null,
      deadline: input.deadline,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  const strategies = data?.strategies ?? [];
  if (!strategies.length) throw new Error("AI не вернул стратегии");
  return strategies.map((s) => ({
    ...s,
    commercialMetricId: s.commercialMetricId ?? input.northStarMetric?.id ?? null,
  }));
}
