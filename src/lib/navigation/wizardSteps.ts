import { BRIEF_STEPS } from "@/lib/offer-generator/constants";
import type { OnboardingStepId } from "@/lib/onboarding/types";
import type { QuizStepId } from "@/lib/quiz/types";

export type OfferWizardPhase = "purpose" | "brief" | "tone";

const OFFER_TONE_INDEX = 1 + BRIEF_STEPS.length;

export function offerWizardToIndex(phase: OfferWizardPhase | "loading" | "result" | "error", briefStep: number): number | null {
  if (phase === "loading" || phase === "result" || phase === "error") return null;
  if (phase === "purpose") return 0;
  if (phase === "brief") return 1 + briefStep;
  if (phase === "tone") return OFFER_TONE_INDEX;
  return null;
}

export function offerWizardFromIndex(index: number): { phase: OfferWizardPhase; briefStep: number } {
  if (index <= 0) return { phase: "purpose", briefStep: 0 };
  if (index <= BRIEF_STEPS.length) return { phase: "brief", briefStep: index - 1 };
  return { phase: "tone", briefStep: BRIEF_STEPS.length - 1 };
}

export const QUIZ_WIZARD_STEPS: QuizStepId[] = [
  "intro",
  "product",
  "audience",
  "goal",
  "website",
  "register",
];

export function quizStepToIndex(step: QuizStepId): number | null {
  if (step === "building") return null;
  const i = QUIZ_WIZARD_STEPS.indexOf(step);
  return i >= 0 ? i : null;
}

export function quizStepFromIndex(index: number): QuizStepId | null {
  return QUIZ_WIZARD_STEPS[index] ?? null;
}

/** Шаги онбординга, по которым ходит browser Back (без completed). */
export const ONBOARDING_WIZARD_STEPS: OnboardingStepId[] = [
  "welcome",
  "project_card",
  "quick_win",
  "wow_result",
  "first_steps",
];

export function onboardingStepToIndex(step: OnboardingStepId): number | null {
  if (step === "completed") return null;
  const i = ONBOARDING_WIZARD_STEPS.indexOf(step);
  return i >= 0 ? i : null;
}

export function onboardingStepFromIndex(index: number): OnboardingStepId | null {
  return ONBOARDING_WIZARD_STEPS[index] ?? null;
}
