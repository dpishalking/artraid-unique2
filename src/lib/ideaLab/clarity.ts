import type { IdeaLabCard } from "./types";

const FIELD_WEIGHTS: { key: keyof IdeaLabCard; weight: number }[] = [
  { key: "idea_name", weight: 8 },
  { key: "short_description", weight: 10 },
  { key: "target_audience", weight: 12 },
  { key: "main_problem", weight: 14 },
  { key: "desired_outcome", weight: 12 },
  { key: "product_format", weight: 10 },
  { key: "primary_offer", weight: 14 },
  { key: "mvp", weight: 10 },
  { key: "demand_hypotheses", weight: 10 },
  { key: "next_step", weight: 10 },
];

function filled(v: string | undefined): boolean {
  return typeof v === "string" && v.trim().length >= 3;
}

export function calculateClarityPercent(card: IdeaLabCard): number {
  let score = 0;
  for (const { key, weight } of FIELD_WEIGHTS) {
    if (filled(card[key])) score += weight;
  }
  return Math.min(100, Math.round(score));
}

export function clarityLabel(percent: number): string {
  if (percent <= 25) return "Пока идея в тумане";
  if (percent <= 50) return "Появляется направление";
  if (percent <= 75) return "Продукт становится кристально ясным";
  return "Готово к первому рыночному тесту";
}
