import type { OnboardingState, OnboardingStepId } from "./types";
import { DEFAULT_ONBOARDING_STATE } from "./types";

const STEP_ORDER: OnboardingStepId[] = [
  "welcome",
  "project_card",
  "quick_win",
  "wow_result",
  "first_steps",
  "completed",
];

export function parseOnboardingState(raw: unknown): OnboardingState {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ONBOARDING_STATE };
  const o = raw as Record<string, unknown>;
  const base = { ...DEFAULT_ONBOARDING_STATE };
  const step = o.currentStep;
  if (typeof step === "string" && STEP_ORDER.includes(step as OnboardingStepId)) {
    base.currentStep = step as OnboardingStepId;
  }
  if (typeof o.skippedAt === "string") base.skippedAt = o.skippedAt;
  if (typeof o.completedAt === "string") base.completedAt = o.completedAt;
  if (typeof o.quickWinScenarioId === "string") {
    base.quickWinScenarioId = o.quickWinScenarioId as OnboardingState["quickWinScenarioId"];
  }
  if (typeof o.quickWinLaunchedAt === "string") base.quickWinLaunchedAt = o.quickWinLaunchedAt;
  if (typeof o.firstGenerationDone === "boolean") base.firstGenerationDone = o.firstGenerationDone;
  if (o.routeSteps && typeof o.routeSteps === "object") {
    base.routeSteps = { ...base.routeSteps, ...(o.routeSteps as OnboardingState["routeSteps"]) };
  }
  return base;
}

export function nextOnboardingStep(step: OnboardingStepId): OnboardingStepId {
  const i = STEP_ORDER.indexOf(step);
  if (i < 0 || i >= STEP_ORDER.length - 1) return "completed";
  return STEP_ORDER[i + 1];
}

export function isOnboardingActive(
  quizCompleted: boolean,
  completedAt: string | null,
  state: OnboardingState,
): boolean {
  if (!quizCompleted) return false;
  if (completedAt) return false;
  if (state.skippedAt) return false;
  if (state.currentStep === "completed") return false;
  return true;
}

export function onboardingProgressStepIndex(step: OnboardingStepId): number {
  const visible: OnboardingStepId[] = ["welcome", "project_card", "quick_win", "first_steps"];
  const i = visible.indexOf(step === "wow_result" ? "quick_win" : step);
  return i >= 0 ? i + 1 : 1;
}
