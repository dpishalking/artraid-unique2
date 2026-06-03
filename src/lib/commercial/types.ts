export type CommercialMetricCategory =
  | "goals"
  | "money"
  | "funnel"
  | "sales"
  | "product"
  | "unit_economics";

export type CommercialMetricDirection =
  | "higher_is_better"
  | "lower_is_better"
  | "target_range";

export type CommercialMetricStatus = "green" | "yellow" | "red" | "empty";

export type CommercialMetric = {
  id: string;
  project_id: string;
  slug: string | null;
  name: string;
  category: CommercialMetricCategory;
  description: string | null;
  unit: string | null;
  plan_value: number | null;
  fact_value: number | null;
  period: string;
  direction: CommercialMetricDirection;
  range_norm: number | null;
  range_tolerance: number | null;
  range_critical: number | null;
  data_source: string | null;
  owner_name: string | null;
  comment: string | null;
  is_custom: boolean;
  is_hidden: boolean;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CommercialMetricSeed = {
  slug: string;
  name: string;
  category: CommercialMetricCategory;
  unit: string;
  direction: CommercialMetricDirection;
  description?: string;
  is_primary?: boolean;
};

export type CommercialMetricsSnapshot = {
  metrics: CommercialMetric[];
  hypothesesByMetricId: Record<string, number>;
};

export const COMMERCIAL_CATEGORY_LABELS: Record<CommercialMetricCategory, string> = {
  goals: "Главные цели",
  money: "Деньги",
  funnel: "Воронка",
  sales: "Продажи",
  product: "Продуктовые метрики",
  unit_economics: "Юнит-экономика",
};

export const COMMERCIAL_DIRECTION_LABELS: Record<CommercialMetricDirection, string> = {
  higher_is_better: "Чем больше, тем лучше",
  lower_is_better: "Чем меньше, тем лучше",
  target_range: "Диапазон нормы",
};

export const COMMERCIAL_PERIOD_OPTIONS = [
  { value: "month", label: "Месяц" },
  { value: "quarter", label: "Квартал" },
  { value: "year", label: "Год" },
] as const;
