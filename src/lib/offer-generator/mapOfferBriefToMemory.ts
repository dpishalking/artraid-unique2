import type { OfferBrief } from "@/lib/offer-generator/types";
import type { ProjectMemorySections } from "./types";

/** Поля брифа оффера → секции памяти проекта. */
export function mapOfferBriefToProjectMemory(
  brief: OfferBrief,
): Partial<ProjectMemorySections> {
  const productDescription = brief.productDescription.trim();
  const targetAudience = brief.targetAudience.trim();
  const customerSituation = brief.customerSituation.trim();
  const painPoint = brief.painPoint.trim();
  const promisedResult = brief.promisedResult.trim();
  const proof = brief.proof.trim();
  const objections = brief.objections.trim();
  const additionalContext = brief.additionalContext.trim();

  const patch: Partial<ProjectMemorySections> = {};

  if (productDescription) {
    patch.product = { product_description: productDescription };
  }
  if (targetAudience || customerSituation) {
    patch.audience = {
      ...(targetAudience ? { target_audience: targetAudience } : {}),
      ...(customerSituation ? { customer_situation: customerSituation } : {}),
    };
  }
  if (painPoint || promisedResult) {
    patch.pains_desires = {
      ...(painPoint ? { main_pain: painPoint } : {}),
      ...(promisedResult ? { main_desire: promisedResult } : {}),
    };
  }
  if (promisedResult) {
    patch.offer_positioning = { key_promise: promisedResult };
  }
  if (proof) {
    patch.proofs = { testimonials: proof };
  }
  if (objections) {
    patch.pains_desires = {
      ...patch.pains_desires,
      frustrations: objections,
    };
  }
  if (additionalContext) {
    patch.constraints = { important_notes: additionalContext };
  }

  return patch;
}

export type OfferBriefContextPatch = {
  product_description?: string;
  target_audience?: string;
  main_pain?: string;
  main_desire?: string;
  key_promise?: string;
  important_notes?: string;
  key_proofs?: string[];
  objections?: string[];
};

export function mapOfferBriefToProjectContext(brief: OfferBrief): OfferBriefContextPatch {
  const splitList = (raw: string) =>
    raw
      .split(/[;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const patch: OfferBriefContextPatch = {};
  const productDescription = brief.productDescription.trim();
  const targetAudience = brief.targetAudience.trim();
  const customerSituation = brief.customerSituation.trim();
  const painPoint = brief.painPoint.trim();
  const promisedResult = brief.promisedResult.trim();
  const proof = brief.proof.trim();
  const objections = brief.objections.trim();
  const additionalContext = brief.additionalContext.trim();

  if (productDescription) patch.product_description = productDescription;
  if (targetAudience) patch.target_audience = targetAudience;
  if (painPoint) patch.main_pain = painPoint;
  if (promisedResult) {
    patch.main_desire = promisedResult;
    patch.key_promise = promisedResult;
  }
  if (customerSituation || additionalContext) {
    patch.important_notes = [customerSituation, additionalContext].filter(Boolean).join("\n\n");
  }
  if (proof) patch.key_proofs = splitList(proof);
  if (objections) patch.objections = splitList(objections);

  return patch;
}
