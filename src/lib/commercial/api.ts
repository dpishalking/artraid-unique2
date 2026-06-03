import { supabase } from "@/integrations/supabase/client";
import { COMMERCIAL_METRIC_SEEDS } from "./seed";
import type { CommercialMetric, CommercialMetricsSnapshot } from "./types";

function predictiveErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || "";
  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "";
}

export function humanizeCommercialError(error: unknown): string {
  const msg = predictiveErrorMessage(error);
  if (!msg) return "Не удалось загрузить коммерческие метрики";
  const low = msg.toLowerCase();
  if (
    low.includes("commercial_metrics") ||
    low.includes("pgrst205") ||
    (low.includes("relation") && low.includes("does not exist"))
  ) {
    return "База не обновлена: выполните supabase db push и обновите страницу.";
  }
  return msg;
}

export async function seedCommercialMetricsIfEmpty(projectId: string): Promise<void> {
  const { data: existing, error: exErr } = await supabase
    .from("commercial_metrics")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);
  if (exErr) throw exErr;
  if ((existing ?? []).length > 0) return;

  const payload = COMMERCIAL_METRIC_SEEDS.map((seed, idx) => ({
    project_id: projectId,
    slug: seed.slug,
    name: seed.name,
    category: seed.category,
    description: seed.description ?? null,
    unit: seed.unit,
    direction: seed.direction,
    is_primary: seed.is_primary ?? false,
    is_custom: false,
    sort_order: idx + 1,
    period: "month",
  }));

  const { error } = await supabase.from("commercial_metrics").insert(payload);
  if (error) throw error;
}

export async function listCommercialMetrics(
  projectId: string,
  opts: { includeHidden?: boolean } = {},
): Promise<CommercialMetric[]> {
  await seedCommercialMetricsIfEmpty(projectId);

  let query = supabase
    .from("commercial_metrics")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (!opts.includeHidden) {
    query = query.eq("is_hidden", false);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as CommercialMetric[];
}

export async function getCommercialMetricsSnapshot(
  projectId: string,
): Promise<CommercialMetricsSnapshot> {
  const metrics = await listCommercialMetrics(projectId, { includeHidden: true });

  const { data: hypoRows, error: hypoErr } = await supabase
    .from("hypotheses")
    .select("commercial_metric_id")
    .eq("project_id", projectId)
    .not("commercial_metric_id", "is", null);
  if (hypoErr) throw hypoErr;

  const hypothesesByMetricId: Record<string, number> = {};
  for (const row of hypoRows ?? []) {
    const id = (row as { commercial_metric_id: string | null }).commercial_metric_id;
    if (!id) continue;
    hypothesesByMetricId[id] = (hypothesesByMetricId[id] ?? 0) + 1;
  }

  return { metrics, hypothesesByMetricId };
}

export async function upsertCommercialMetric(
  id: string,
  patch: Partial<
    Pick<
      CommercialMetric,
      | "name"
      | "description"
      | "unit"
      | "plan_value"
      | "fact_value"
      | "period"
      | "direction"
      | "range_norm"
      | "range_tolerance"
      | "range_critical"
      | "data_source"
      | "owner_name"
      | "comment"
      | "is_hidden"
      | "is_primary"
    >
  >,
): Promise<void> {
  const { error } = await supabase.from("commercial_metrics").update(patch).eq("id", id);
  if (error) throw error;
}

export async function createCustomCommercialMetric(input: {
  projectId: string;
  name: string;
  category: CommercialMetric["category"];
  unit?: string;
  direction?: CommercialMetric["direction"];
  description?: string;
}): Promise<CommercialMetric> {
  const { data: maxRow } = await supabase
    .from("commercial_metrics")
    .select("sort_order")
    .eq("project_id", input.projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sortOrder = ((maxRow as { sort_order?: number } | null)?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("commercial_metrics")
    .insert({
      project_id: input.projectId,
      name: input.name.trim(),
      category: input.category,
      unit: input.unit?.trim() || "шт",
      direction: input.direction ?? "higher_is_better",
      description: input.description?.trim() || null,
      is_custom: true,
      sort_order: sortOrder,
      period: "month",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as CommercialMetric;
}

export async function listHypothesesForMetric(metricId: string) {
  const { data, error } = await supabase
    .from("hypotheses")
    .select("id, title, status, created_at")
    .eq("commercial_metric_id", metricId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function syncFromProjectMemory(
  projectId: string,
  memoryMetrics: {
    monthly_revenue?: string | number | null;
    average_check?: string | number | null;
    conversion_rate?: string | number | null;
    cpl?: string | number | null;
    cpa?: string | number | null;
    roas?: string | number | null;
    ad_spend?: string | number | null;
  },
): Promise<number> {
  const metrics = await listCommercialMetrics(projectId, { includeHidden: true });
  const bySlug = new Map(metrics.filter((m) => m.slug).map((m) => [m.slug!, m]));

  const mapping: Array<[string, string | number | null | undefined]> = [
    ["revenue", memoryMetrics.monthly_revenue],
    ["avg_check_money", memoryMetrics.average_check],
    ["site_conversion", memoryMetrics.conversion_rate],
    ["lead_cost", memoryMetrics.cpl],
    ["max_cac", memoryMetrics.cpa],
    ["roas", memoryMetrics.roas],
    ["ad_budget", memoryMetrics.ad_spend],
  ];

  let updated = 0;
  for (const [slug, raw] of mapping) {
    const metric = bySlug.get(slug);
    if (!metric || raw == null || raw === "") continue;
    const num = typeof raw === "number" ? raw : parseFloat(String(raw).replace(",", ".").replace("%", ""));
    if (Number.isNaN(num)) continue;
    if (metric.plan_value != null) continue;
    await upsertCommercialMetric(metric.id, { plan_value: num });
    updated += 1;
  }
  return updated;
}
