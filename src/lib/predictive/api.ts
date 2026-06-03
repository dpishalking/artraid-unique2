import { supabase } from "@/integrations/supabase/client";
import type {
  PredictiveActionItem,
  PredictiveActionItemStatus,
  PredictiveAlert,
  PredictiveAlertStatus,
  PredictiveCategory,
  PredictiveCell,
  PredictiveComment,
  PredictiveDashboardSummary,
  PredictiveMetricDependency,
  PredictiveMetric,
  PredictiveMetricRow,
  PredictiveModel,
  PredictiveModelSnapshot,
  PredictivePeriod,
  PredictiveStatus,
} from "./types";

function predictiveErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || "";
  if (typeof error === "object" && error !== null && "message" in error) {
    const msg = (error as { message: unknown }).message;
    if (typeof msg === "string") return msg;
  }
  return "";
}

export function humanizePredictiveError(error: unknown): string {
  const msg = predictiveErrorMessage(error);
  if (!msg) return "Не удалось загрузить модель";

  const low = msg.toLowerCase();
  if (
    low.includes("predictive_models") ||
    low.includes("predictive_periods") ||
    low.includes("predictive_metrics") ||
    low.includes("pgrst205") ||
    low.includes("schema cache") ||
    (low.includes("relation") && low.includes("does not exist"))
  ) {
    return "База не обновлена: отсутствуют таблицы предиктивной модели. Выполните supabase db push и обновите страницу.";
  }
  if (low.includes("no unique or exclusion constraint") || low.includes("on_conflict")) {
    return "Не удалось создать периоды модели. Обновите страницу — исправление уже в деплое.";
  }
  if (low.includes("row-level security") || low.includes("permission denied")) {
    return "Нет доступа к модели: откройте проект под своим аккаунтом.";
  }
  return msg;
}

function monthName(month: number): string {
  return new Date(2026, month - 1, 1).toLocaleDateString("ru-RU", { month: "short" });
}

function statusFromScore(score: number | null): PredictiveStatus {
  if (score == null || Number.isNaN(score)) return "status-empty";
  if (score >= 100) return "status-green";
  if (score >= 90) return "status-yellow";
  return "status-red";
}

function calculateCell(
  plan: number | null,
  fact: number | null,
  direction: PredictiveMetric["direction"],
): Omit<PredictiveCell, "metric_id" | "period_id" | "plan" | "fact"> {
  if (plan == null || fact == null || plan === 0 || fact === 0) {
    return {
      ptf_percent: null,
      deviation: null,
      run_rate: null,
      forecast: null,
      forecast_achievement: null,
      status: "status-empty",
    };
  }

  const ptf =
    direction === "lower_is_better"
      ? (plan / fact) * 100
      : (fact / plan) * 100;
  const deviation =
    direction === "lower_is_better"
      ? plan - fact
      : fact - plan;

  // Sprint 1: simplified run-rate/forecast on month granularity.
  const runRate = fact;
  const forecast = runRate;
  const forecastAchievement =
    direction === "lower_is_better"
      ? (plan / forecast) * 100
      : (forecast / plan) * 100;

  return {
    ptf_percent: ptf,
    deviation,
    run_rate: runRate,
    forecast,
    forecast_achievement: forecastAchievement,
    status: statusFromScore(ptf),
  };
}

function evaluateFormulaValue(args: {
  formulaHint: string;
  byMetricId: Map<string, number | null>;
}): number | null {
  const exprRaw = args.formulaHint.trim();
  if (!exprRaw) return null;
  const replaced = exprRaw.replace(/\[([a-f0-9-]{36})\]/gi, (_m, id: string) => {
    const val = args.byMetricId.get(id) ?? 0;
    return String(val ?? 0);
  });
  if (!/^[0-9+\-*/().\s]+$/.test(replaced)) return null;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${replaced});`)() as number;
    if (typeof result !== "number" || Number.isNaN(result) || !Number.isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

async function ensurePeriods(model: PredictiveModel): Promise<PredictivePeriod[]> {
  const { data: existing, error: existingErr } = await supabase
    .from("predictive_periods")
    .select("*")
    .eq("model_id", model.id)
    .eq("type", "month")
    .order("sort_order", { ascending: true });
  if (existingErr) throw existingErr;

  const existingMonths = (existing ?? []) as unknown as PredictivePeriod[];
  const existingMonthNumbers = new Set(
    existingMonths.map((p) => p.month).filter((m): m is number => m != null),
  );

  if (existingMonthNumbers.size < 12) {
    const payload = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      if (existingMonthNumbers.has(month)) return null;
      const start = new Date(model.year, i, 1);
      const end = new Date(model.year, i + 1, 0);
      return {
        model_id: model.id,
        type: "month",
        year: model.year,
        month,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        sort_order: month,
      };
    }).filter(Boolean);

    if (payload.length > 0) {
      const { error: insertErr } = await supabase
        .from("predictive_periods")
        .insert(payload);
      if (insertErr) throw insertErr;
    }
  }

  const { data: ready, error: readyErr } = await supabase
    .from("predictive_periods")
    .select("*")
    .eq("model_id", model.id)
    .in("type", ["month", "week"])
    .order("sort_order", { ascending: true });
  if (readyErr) throw readyErr;

  const all = (ready ?? []) as unknown as PredictivePeriod[];
  const monthById = new Map(
    all.filter((p) => p.type === "month").map((p) => [p.id, p]),
  );
  const weeks = all.filter((p) => p.type === "week");
  if (weeks.length > 0) return all;

  const weekPayload: Array<Record<string, unknown>> = [];
  for (const m of all.filter((p) => p.type === "month")) {
    const monthIndex = (m.month ?? 1) - 1;
    let current = new Date(model.year, monthIndex, 1);
    const last = new Date(model.year, monthIndex + 1, 0);
    let w = 1;
    while (current <= last) {
      const start = new Date(current);
      const end = new Date(current);
      end.setDate(end.getDate() + 6);
      if (end > last) end.setTime(last.getTime());
      weekPayload.push({
        model_id: model.id,
        type: "week",
        year: model.year,
        month: m.month,
        week: w,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        parent_period_id: m.id,
        sort_order: (m.month ?? 1) * 10 + w,
      });
      current.setDate(current.getDate() + 7);
      w += 1;
    }
  }
  if (weekPayload.length > 0) {
    const { error: weekErr } = await supabase
      .from("predictive_periods")
      .insert(weekPayload);
    if (weekErr) throw weekErr;
  }

  const { data: done, error: doneErr } = await supabase
    .from("predictive_periods")
    .select("*")
    .eq("model_id", model.id)
    .in("type", ["month", "week"])
    .order("sort_order", { ascending: true });
  if (doneErr) throw doneErr;

  const donePeriods = (done ?? []) as unknown as PredictivePeriod[];
  // Ensure week parent links are valid.
  return donePeriods.map((p) => {
    if (p.type !== "week" || p.parent_period_id || !p.month) return p;
    const parent = Array.from(monthById.values()).find((m) => m.month === p.month);
    return { ...p, parent_period_id: parent?.id ?? null };
  });
}

export async function getOrCreatePredictiveModel(
  projectId: string,
  year: number,
): Promise<PredictiveModel> {
  const { data: existing, error: exErr } = await supabase
    .from("predictive_models")
    .select("*")
    .eq("project_id", projectId)
    .eq("year", year)
    .maybeSingle();
  if (exErr) throw exErr;
  if (existing) return existing as unknown as PredictiveModel;

  const { data: created, error: createErr } = await supabase
    .from("predictive_models")
    .insert({
      project_id: projectId,
      name: `Модель ${year}`,
      year,
      currency: "RUB",
    })
    .select("*")
    .single();
  if (createErr) throw createErr;

  return created as unknown as PredictiveModel;
}

export async function seedPredictiveModelIfEmpty(modelId: string): Promise<void> {
  const { data: countRows, error: cErr } = await supabase
    .from("predictive_categories")
    .select("id")
    .eq("model_id", modelId)
    .limit(1);
  if (cErr) throw cErr;
  if ((countRows ?? []).length > 0) return;

  const categories = [
    "Финансы",
    "Маркетинг",
    "Продажи",
    "Сервис",
  ];

  const { data: createdCats, error: catErr } = await supabase
    .from("predictive_categories")
    .insert(
      categories.map((name, idx) => ({
        model_id: modelId,
        name,
        sort_order: idx + 1,
      })),
    )
    .select("*");
  if (catErr) throw catErr;

  const byName = new Map((createdCats ?? []).map((c) => [String((c as { name: string }).name), c]));
  const metricsSeed: Array<{
    category: string;
    name: string;
    type: PredictiveMetric["type"];
    unit: string;
    direction: PredictiveMetric["direction"];
    owner_name: string;
  }> = [
    { category: "Финансы", name: "Выручка", type: "currency", unit: "RUB", direction: "higher_is_better", owner_name: "Коммерческий директор" },
    { category: "Финансы", name: "Валовая маржа", type: "percent", unit: "%", direction: "higher_is_better", owner_name: "Финансовый менеджер" },
    { category: "Маркетинг", name: "Лиды", type: "count", unit: "лиды", direction: "higher_is_better", owner_name: "Head of Marketing" },
    { category: "Маркетинг", name: "CPL", type: "currency", unit: "RUB", direction: "lower_is_better", owner_name: "Performance manager" },
    { category: "Продажи", name: "Сделки", type: "count", unit: "сделки", direction: "higher_is_better", owner_name: "Head of Sales" },
    { category: "Продажи", name: "Конверсия в сделку", type: "percent", unit: "%", direction: "higher_is_better", owner_name: "Head of Sales" },
    { category: "Сервис", name: "NPS", type: "number", unit: "баллы", direction: "higher_is_better", owner_name: "Customer Success" },
    { category: "Сервис", name: "SLA (дни)", type: "days", unit: "дни", direction: "lower_is_better", owner_name: "Operations manager" },
  ];

  const payload = metricsSeed
    .map((m, i) => {
      const cat = byName.get(m.category) as { id: string } | undefined;
      if (!cat) return null;
      return {
        category_id: cat.id,
        name: m.name,
        type: m.type,
        unit: m.unit,
        owner_name: m.owner_name,
        direction: m.direction,
        sort_order: i + 1,
      };
    })
    .filter(Boolean);

  if (payload.length === 0) return;

  const { error: mErr } = await supabase.from("predictive_metrics").insert(payload);
  if (mErr) throw mErr;
}

export async function getPredictiveSnapshot(
  projectId: string,
  year: number,
): Promise<PredictiveModelSnapshot> {
  const model = await getOrCreatePredictiveModel(projectId, year);
  await seedPredictiveModelIfEmpty(model.id);
  const periods = await ensurePeriods(model);

  const [categoriesRes, metricsRes, plansRes, factsRes, commentsRes, depsRes] = await Promise.all([
    supabase
      .from("predictive_categories")
      .select("*")
      .eq("model_id", model.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("predictive_metrics")
      .select("*, predictive_categories!inner(model_id)")
      .eq("predictive_categories.model_id", model.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("predictive_plan_values")
      .select("metric_id, period_id, value"),
    supabase
      .from("predictive_fact_values")
      .select("metric_id, period_id, value"),
    supabase
      .from("predictive_comments")
      .select("*")
      .eq("model_id", model.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("predictive_metric_dependencies")
      .select("*")
      .eq("model_id", model.id),
  ]);

  if (categoriesRes.error) throw categoriesRes.error;
  if (metricsRes.error) throw metricsRes.error;
  if (plansRes.error) throw plansRes.error;
  if (factsRes.error) throw factsRes.error;
  if (commentsRes.error) throw commentsRes.error;
  if (depsRes.error) throw depsRes.error;

  const categories = (categoriesRes.data ?? []) as unknown as PredictiveCategory[];
  const metrics = (metricsRes.data ?? []) as unknown as PredictiveMetric[];
  const deps = (depsRes.data ?? []) as unknown as PredictiveMetricDependency[];
  const periodIds = new Set(periods.map((p) => p.id));

  const planMap = new Map<string, number | null>();
  for (const row of (plansRes.data ?? []) as Array<{ metric_id: string; period_id: string; value: number | null }>) {
    if (periodIds.has(row.period_id)) {
      planMap.set(`${row.metric_id}:${row.period_id}`, row.value);
    }
  }
  const factMap = new Map<string, number | null>();
  for (const row of (factsRes.data ?? []) as Array<{ metric_id: string; period_id: string; value: number | null }>) {
    if (periodIds.has(row.period_id)) {
      factMap.set(`${row.metric_id}:${row.period_id}`, row.value);
    }
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const rowsByMetric = new Map<string, PredictiveMetricRow>();
  const rows: PredictiveMetricRow[] = metrics.map((metric) => {
    const cells: Record<string, PredictiveCell> = {};
    for (const period of periods) {
      const key = `${metric.id}:${period.id}`;
      const plan = planMap.get(key) ?? null;
      const fact = factMap.get(key) ?? null;
      const calc = calculateCell(plan, fact, metric.direction);
      cells[period.id] = {
        metric_id: metric.id,
        period_id: period.id,
        plan,
        fact,
        ...calc,
      };
    }

    const row: PredictiveMetricRow = {
      category: categoryById.get(metric.category_id)!,
      metric,
      cells,
    };
    rowsByMetric.set(metric.id, row);
    return row;
  });

  // Formula engine pass: evaluate formula metrics from dependencies for each visible period.
  for (const period of periods) {
    const metricPlanMap = new Map<string, number | null>();
    const metricFactMap = new Map<string, number | null>();
    for (const row of rows) {
      const cell = row.cells[period.id];
      metricPlanMap.set(row.metric.id, cell?.plan ?? null);
      metricFactMap.set(row.metric.id, cell?.fact ?? null);
    }

    const formulaDeps = deps.filter((d) => d.formula_hint && d.formula_hint.trim().length > 0);
    for (const dep of formulaDeps) {
      const parentRow = rowsByMetric.get(dep.parent_metric_id);
      if (!parentRow) continue;
      if (parentRow.metric.calculation_type !== "formula") continue;
      const targetCell = parentRow.cells[period.id];
      if (!targetCell) continue;

      const formula = dep.formula_hint ?? "";
      const planValue = evaluateFormulaValue({ formulaHint: formula, byMetricId: metricPlanMap });
      const factValue = evaluateFormulaValue({ formulaHint: formula, byMetricId: metricFactMap });
      const calc = calculateCell(planValue, factValue, parentRow.metric.direction);
      parentRow.cells[period.id] = {
        ...targetCell,
        plan: planValue,
        fact: factValue,
        ...calc,
      };

      metricPlanMap.set(parentRow.metric.id, planValue);
      metricFactMap.set(parentRow.metric.id, factValue);
    }
  }

  const comments = (commentsRes.data ?? []) as unknown as PredictiveComment[];
  return { model, categories, metrics, periods, comments, rows };
}

export async function upsertPredictiveValue(args: {
  modelId: string;
  metricId: string;
  periodId: string;
  kind: "plan" | "fact";
  value: number | null;
}): Promise<void> {
  const table = args.kind === "plan" ? "predictive_plan_values" : "predictive_fact_values";
  const payload = {
    metric_id: args.metricId,
    period_id: args.periodId,
    value: args.value,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(table)
    .upsert(payload, { onConflict: "metric_id,period_id" });
  if (error) throw error;
}

export function buildPredictiveSummary(snapshot: PredictiveModelSnapshot): PredictiveDashboardSummary {
  const nowMonth = new Date().getMonth() + 1;
  const month = snapshot.periods.find((p) => p.month === nowMonth) ?? snapshot.periods[0];
  let revenuePlan = 0;
  let revenueFact = 0;
  let runRate = 0;
  let forecast = 0;
  let green = 0;
  let yellow = 0;
  let red = 0;

  for (const row of snapshot.rows) {
    const cell = month ? row.cells[month.id] : null;
    if (!cell) continue;
    if (cell.status === "status-green") green += 1;
    if (cell.status === "status-yellow") yellow += 1;
    if (cell.status === "status-red") red += 1;

    if (row.metric.name.toLowerCase().includes("выруч")) {
      revenuePlan += cell.plan ?? 0;
      revenueFact += cell.fact ?? 0;
      runRate += cell.run_rate ?? 0;
      forecast += cell.forecast ?? 0;
    }
  }

  const achievementPercent = revenuePlan > 0 ? (revenueFact / revenuePlan) * 100 : 0;
  const forecastVsPlan = revenuePlan > 0 ? (forecast / revenuePlan) * 100 : 0;

  return {
    revenuePlan,
    revenueFact,
    achievementPercent,
    runRate,
    forecast,
    forecastVsPlan,
    green,
    yellow,
    red,
    criticalAlerts: red,
  };
}

export function monthLabel(period: PredictivePeriod): string {
  if (!period.month) return "—";
  return monthName(period.month);
}

export function weekLabel(period: PredictivePeriod): string {
  if (period.type !== "week") return "—";
  const start = new Date(period.start_date);
  const end = new Date(period.end_date);
  const dd = (d: Date) => String(d.getDate()).padStart(2, "0");
  return `W${period.week ?? "?"} ${dd(start)}–${dd(end)}`;
}

export async function addPredictiveComment(args: {
  modelId: string;
  metricId: string;
  periodId: string;
  comment: string;
  rootCause?: string;
  actionPlan?: string;
  responsible?: string;
  deadline?: string;
}): Promise<void> {
  const { error } = await supabase.from("predictive_comments").insert({
    model_id: args.modelId,
    metric_id: args.metricId,
    period_id: args.periodId,
    comment: args.comment,
    root_cause: args.rootCause ?? null,
    action_plan: args.actionPlan ?? null,
    responsible: args.responsible ?? null,
    deadline: args.deadline ?? null,
  });
  if (error) throw error;
}

export async function syncPredictiveAlerts(snapshot: PredictiveModelSnapshot): Promise<void> {
  const redCells: Array<{
    metric_id: string;
    period_id: string;
    message: string;
  }> = [];
  for (const row of snapshot.rows) {
    for (const period of snapshot.periods) {
      const cell = row.cells[period.id];
      if (!cell || cell.status !== "status-red") continue;
      redCells.push({
        metric_id: row.metric.id,
        period_id: period.id,
        message: `${row.metric.name}: ниже 90% плана`,
      });
    }
  }
  if (redCells.length === 0) return;

  const { error } = await supabase.from("predictive_alerts").upsert(
    redCells.map((c) => ({
      model_id: snapshot.model.id,
      metric_id: c.metric_id,
      period_id: c.period_id,
      alert_type: "below_90",
      message: c.message,
      status: "open",
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "model_id,metric_id,period_id,alert_type" },
  );
  if (error) throw error;
}

export async function listPredictiveAlerts(modelId: string): Promise<PredictiveAlert[]> {
  const { data, error } = await supabase
    .from("predictive_alerts")
    .select("*")
    .eq("model_id", modelId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as PredictiveAlert[];
}

export async function updatePredictiveAlertStatus(
  alertId: string,
  status: PredictiveAlertStatus,
): Promise<void> {
  const { error } = await supabase
    .from("predictive_alerts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", alertId);
  if (error) throw error;
}

export async function createActionItemFromAlert(args: {
  modelId: string;
  metricId: string | null;
  periodId: string | null;
  task: string;
  reason?: string;
  responsible?: string;
  deadline?: string;
}): Promise<void> {
  const { error } = await supabase.from("predictive_action_items").insert({
    model_id: args.modelId,
    metric_id: args.metricId,
    period_id: args.periodId,
    task: args.task,
    reason: args.reason ?? null,
    responsible: args.responsible ?? null,
    deadline: args.deadline ?? null,
    status: "open",
  });
  if (error) throw error;
}

export async function listActionItems(modelId: string): Promise<PredictiveActionItem[]> {
  const { data, error } = await supabase
    .from("predictive_action_items")
    .select("*")
    .eq("model_id", modelId)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []) as unknown as PredictiveActionItem[];
}

export async function updateActionItemStatus(
  actionItemId: string,
  status: PredictiveActionItemStatus,
): Promise<void> {
  const { error } = await supabase
    .from("predictive_action_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", actionItemId);
  if (error) throw error;
}

export async function listMetricDependencies(modelId: string): Promise<PredictiveMetricDependency[]> {
  const { data, error } = await supabase
    .from("predictive_metric_dependencies")
    .select("*")
    .eq("model_id", modelId);
  if (error) throw error;
  return (data ?? []) as unknown as PredictiveMetricDependency[];
}

export async function upsertMetricDependency(args: {
  modelId: string;
  parentMetricId: string;
  childMetricId: string;
  formulaHint?: string;
}): Promise<void> {
  // Mark parent as formula metric when dependency is configured.
  const { error: metricErr } = await supabase
    .from("predictive_metrics")
    .update({ calculation_type: "formula" })
    .eq("id", args.parentMetricId);
  if (metricErr) throw metricErr;

  const { error } = await supabase
    .from("predictive_metric_dependencies")
    .upsert(
      {
        model_id: args.modelId,
        parent_metric_id: args.parentMetricId,
        child_metric_id: args.childMetricId,
        formula_hint: args.formulaHint ?? null,
      },
      { onConflict: "parent_metric_id,child_metric_id" },
    );
  if (error) throw error;
}
