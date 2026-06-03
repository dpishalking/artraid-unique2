import { formatBestOfferCopy } from "./formatters";
import type { OfferBrief, OfferResult } from "./types";

const STORAGE_KEY = "mm_offer_prototype_prefill_v1";

export type OfferPrototypePrefill = {
  scenarioId: string;
  answers: Record<string, string>;
  offerSummary: string;
};

function pickScenarioId(purpose: OfferBrief["offerPurpose"]): string {
  if (purpose === "product" || purpose === "service") return "product_card";
  return "cold_traffic";
}

/** Сохранить бриф оффера для подстановки в /prototype (sessionStorage). */
export function saveOfferPrototypePrefill(brief: OfferBrief, result: OfferResult): void {
  const scenarioId = pickScenarioId(brief.offerPurpose);
  const landing = result.formatVersions.landing;
  const headline = (landing?.headline || result.bestOffer.headline).trim();
  const subheadline = (landing?.subheadline || result.bestOffer.subheadline).trim();
  const cta = (landing?.cta || result.bestOffer.cta).trim();

  const productBlock = [headline, subheadline, brief.productDescription.trim()]
    .filter(Boolean)
    .join("\n\n");

  let answers: Record<string, string> = {};

  if (scenarioId === "product_card") {
    answers = {
      product: productBlock,
      audience: brief.targetAudience.trim(),
      mainValue: brief.promisedResult.trim() || result.angles.result.trim(),
      tasks: brief.customerSituation.trim() || brief.painPoint.trim(),
      howItWorks: result.angles.mechanism.trim() || brief.promisedResult.trim(),
      examples: [brief.proof.trim(), brief.additionalContext.trim()].filter(Boolean).join("\n\n"),
      nextStep: cta,
    };
  } else {
    answers = {
      product: productBlock,
      coldAudience: brief.targetAudience.trim(),
      mainPain: brief.painPoint.trim(),
      failedAlternatives: brief.customerSituation.trim(),
      mechanism: result.angles.mechanism.trim() || brief.promisedResult.trim(),
      proof: [brief.proof.trim(), brief.additionalContext.trim()].filter(Boolean).join("\n\n"),
      objections: brief.objections.trim(),
      targetAction: cta,
    };
  }

  const payload: OfferPrototypePrefill = {
    scenarioId,
    answers,
    offerSummary: formatBestOfferCopy(result),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function loadOfferPrototypePrefill(): OfferPrototypePrefill | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OfferPrototypePrefill;
    if (!parsed?.scenarioId || typeof parsed.answers !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearOfferPrototypePrefill(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Прочитать и удалить — одноразовая подстановка при входе в конструктор. */
export function consumeOfferPrototypePrefill(): OfferPrototypePrefill | null {
  const data = loadOfferPrototypePrefill();
  if (data) clearOfferPrototypePrefill();
  return data;
}

export function buildPrototypeFromOfferUrl(projectId?: string): string {
  const params = new URLSearchParams({ fromOffer: "1" });
  if (projectId) params.set("projectId", projectId);
  return `/prototype?${params.toString()}`;
}
