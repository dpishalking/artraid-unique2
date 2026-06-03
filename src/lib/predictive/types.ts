export type PredictiveMetricType =
  | "number"
  | "currency"
  | "percent"
  | "ratio"
  | "days"
  | "count";

export type PredictiveDirection =
  | "higher_is_better"
  | "lower_is_better"
  | "target_is_better";

export type PredictivePeriodType = "year" | "quarter" | "month" | "week" | "day";

export type PredictiveStatus =
  | "status-green"
  | "status-yellow"
  | "status-red"
  | "status-empty";

export type PredictiveModel = {
  id: string;
  project_id: string;
  name: string;
  year: number;
  currency: string;
  description: string | null;
};

export type PredictiveCategory = {
  id: string;
  model_id: string;
  name: string;
  sort_order: number;
};

export type PredictiveMetric = {
  id: string;
  category_id: string;
  name: string;
  type: PredictiveMetricType;
  unit: string | null;
  owner_name: string | null;
  direction: PredictiveDirection;
  calculation_type: "manual" | "formula" | "imported" | "mixed";
  sort_order: number;
  is_active: boolean;
};

export type PredictivePeriod = {
  id: string;
  model_id: string;
  type: PredictivePeriodType;
  year: number;
  month: number | null;
  week: number | null;
  date: string | null;
  quarter: number | null;
  start_date: string;
  end_date: string;
  parent_period_id: string | null;
  sort_order: number;
};

export type PredictiveCell = {
  metric_id: string;
  period_id: string;
  plan: number | null;
  fact: number | null;
  ptf_percent: number | null;
  deviation: number | null;
  run_rate: number | null;
  forecast: number | null;
  forecast_achievement: number | null;
  status: PredictiveStatus;
};

export type PredictiveMetricRow = {
  category: PredictiveCategory;
  metric: PredictiveMetric;
  cells: Record<string, PredictiveCell>;
};

export type PredictiveModelSnapshot = {
  model: PredictiveModel;
  categories: PredictiveCategory[];
  metrics: PredictiveMetric[];
  periods: PredictivePeriod[];
  comments: PredictiveComment[];
  rows: PredictiveMetricRow[];
};

export type PredictiveDashboardSummary = {
  revenuePlan: number;
  revenueFact: number;
  achievementPercent: number;
  runRate: number;
  forecast: number;
  forecastVsPlan: number;
  green: number;
  yellow: number;
  red: number;
  criticalAlerts: number;
};

export type PredictiveComment = {
  id: string;
  model_id: string;
  metric_id: string | null;
  period_id: string | null;
  comment: string;
  root_cause: string | null;
  action_plan: string | null;
  responsible: string | null;
  deadline: string | null;
  created_at: string;
};

export type PredictiveAlertStatus = "open" | "in_progress" | "resolved" | "ignored";

export type PredictiveAlert = {
  id: string;
  model_id: string;
  metric_id: string | null;
  period_id: string | null;
  alert_type: string;
  message: string;
  status: PredictiveAlertStatus;
  created_at: string;
};

export type PredictiveActionItemStatus = "open" | "in_progress" | "done" | "cancelled";

export type PredictiveActionItem = {
  id: string;
  model_id: string;
  metric_id: string | null;
  period_id: string | null;
  task: string;
  reason: string | null;
  responsible: string | null;
  deadline: string | null;
  status: PredictiveActionItemStatus;
  created_at: string;
};

export type PredictiveMetricDependency = {
  id: string;
  model_id: string;
  parent_metric_id: string;
  child_metric_id: string;
  formula_hint: string | null;
};
