import type { OfferBrief } from "./types";

const REQUIRED_KEYS: (keyof OfferBrief)[] = [
  "offerPurpose",
  "productDescription",
  "targetAudience",
  "painPoint",
  "promisedResult",
];

export function validateBriefForGeneration(brief: OfferBrief): string | null {
  if (!brief.offerPurpose) {
    return "Выберите, для чего нужен оффер.";
  }
  if (brief.offerPurpose === "custom" && !brief.customPurpose?.trim()) {
    return "Заполните это поле, чтобы оффер получился конкретным.";
  }
  for (const key of REQUIRED_KEYS) {
    if (key === "offerPurpose") continue;
    const v = brief[key];
    if (typeof v !== "string" || v.trim().length < 2) {
      return "Заполните это поле, чтобы оффер получился конкретным.";
    }
  }
  if (!brief.tone) {
    return "Выберите тон оффера.";
  }
  return null;
}

export function validateBriefStepField(
  key: keyof OfferBrief,
  brief: OfferBrief,
): string | null {
  if (key === "offerPurpose") {
    if (brief.offerPurpose === "custom" && !brief.customPurpose?.trim()) {
      return "Заполните это поле, чтобы оффер получился конкретным.";
    }
    return null;
  }
  const required = ["productDescription", "targetAudience", "painPoint", "promisedResult"].includes(
    key,
  );
  if (!required) return null;
  const v = brief[key];
  if (typeof v !== "string" || v.trim().length < 2) {
    return "Заполните это поле, чтобы оффер получился конкретным.";
  }
  return null;
}
