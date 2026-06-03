import type { CommercialMetric, CommercialMetricStatus } from "./types";

export function calculateMetricStatus(metric: Pick<
  CommercialMetric,
  "plan_value" | "fact_value" | "direction" | "range_norm" | "range_tolerance" | "range_critical"
>): CommercialMetricStatus {
  const { plan_value, fact_value, direction, range_norm, range_tolerance, range_critical } = metric;

  if (fact_value == null) return "empty";

  if (direction === "target_range") {
    const target = range_norm ?? plan_value;
    if (target == null || target === 0) return "empty";
    const tolerance = range_tolerance ?? 10;
    const critical = range_critical ?? 20;
    const deviation = Math.abs((fact_value - target) / target) * 100;
    if (deviation <= tolerance) return "green";
    if (deviation <= critical) return "yellow";
    return "red";
  }

  if (plan_value == null || plan_value === 0) return "empty";

  const ratio = (fact_value / plan_value) * 100;

  if (direction === "lower_is_better") {
    if (ratio <= 100) return "green";
    if (ratio <= 110) return "yellow";
    return "red";
  }

  if (ratio >= 100) return "green";
  if (ratio >= 90) return "yellow";
  return "red";
}

export function statusLabel(status: CommercialMetricStatus): string {
  if (status === "green") return "Зелёный";
  if (status === "yellow") return "Жёлтый";
  if (status === "red") return "Красный";
  return "—";
}

export function statusPercent(metric: Pick<
  CommercialMetric,
  "plan_value" | "fact_value" | "direction"
>): number | null {
  if (metric.plan_value == null || metric.fact_value == null || metric.plan_value === 0) return null;
  if (metric.direction === "lower_is_better") {
    return Math.round((metric.fact_value / metric.plan_value) * 100);
  }
  return Math.round((metric.fact_value / metric.plan_value) * 100);
}
