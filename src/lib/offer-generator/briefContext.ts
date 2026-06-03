import type { OfferBrief } from "./types";
import { BRIEF_STEPS } from "./constants";

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}…`;
}

/** Одна строка контекста из предыдущих ответов (как subtitle в wizard Apple). */
export function getBriefContextLine(stepIndex: number, brief: OfferBrief): string | null {
  if (stepIndex <= 0) return null;

  const product = brief.productDescription?.trim();
  const audience = brief.targetAudience?.trim();

  if (stepIndex === 1 && product) {
    return `Продукт: ${truncate(product, 72)}`;
  }

  const parts: string[] = [];
  if (product) parts.push(`Продукт: ${truncate(product, 48)}`);
  if (stepIndex >= 2 && audience) parts.push(`Аудитория: ${truncate(audience, 48)}`);

  return parts.length > 0 ? parts.join(" · ") : null;
}

export const BRIEF_STEP_LABELS = BRIEF_STEPS.map((s) => {
  const map: Record<string, string> = {
    productDescription: "Продукт",
    targetAudience: "Аудитория",
    customerSituation: "Ситуация",
    painPoint: "Боль",
    promisedResult: "Результат",
    proof: "Доказательства",
    objections: "Возражения",
  };
  return map[s.key] ?? s.question;
});
