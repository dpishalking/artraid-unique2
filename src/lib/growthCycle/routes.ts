export const GROWTH_CYCLE_PATH = "/growth-cycle";

export function growthCycleHref(projectId: string, step?: GrowthCycleStep): string {
  const params = new URLSearchParams({ projectId });
  if (step) params.set("step", step);
  return `${GROWTH_CYCLE_PATH}?${params.toString()}`;
}

export function growthCycleProjectPath(projectId: string, step?: GrowthCycleStep): string {
  const base = `/projects/${projectId}/growth-cycle`;
  return step ? `${base}?step=${step}` : base;
}

export type GrowthCycleStep = "audit" | "hypotheses" | "implement" | "results";

export const GROWTH_CYCLE_STEPS: {
  id: GrowthCycleStep;
  label: string;
  short: string;
}[] = [
  { id: "audit", label: "Аудит", short: "Разбор сайта" },
  { id: "hypotheses", label: "Гипотезы", short: "10 из отчёта" },
  { id: "implement", label: "Внедрение", short: "Канбан" },
  { id: "results", label: "Итоги", short: "Результат" },
];

export function parseGrowthCycleStep(raw: string | null): GrowthCycleStep {
  if (raw === "hypotheses" || raw === "implement" || raw === "results") return raw;
  return "audit";
}
