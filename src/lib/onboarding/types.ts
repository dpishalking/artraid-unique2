export type OnboardingStepId =
  | "welcome"
  | "project_card"
  | "quick_win"
  | "wow_result"
  | "first_steps"
  | "completed";

export type OnboardingRouteStepId =
  | "project_card"
  | "offer"
  | "audit"
  | "hero"
  | "prototype";

export type RouteStepStatus = "pending" | "in_progress" | "done";

export type QuickWinScenarioId =
  | "audit"
  | "offer"
  | "prototype"
  | "conversion_gaps"
  | "hero_variants";

export type OnboardingState = {
  version: 1;
  currentStep: OnboardingStepId;
  skippedAt?: string;
  completedAt?: string;
  quickWinScenarioId?: QuickWinScenarioId;
  quickWinLaunchedAt?: string;
  firstGenerationDone?: boolean;
  routeSteps: Partial<Record<OnboardingRouteStepId, RouteStepStatus>>;
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  version: 1,
  currentStep: "welcome",
  routeSteps: {
    project_card: "in_progress",
    offer: "pending",
    audit: "pending",
    hero: "pending",
    prototype: "pending",
  },
};
