import { supabase } from "@/integrations/supabase/client";
import type { OnboardingState } from "./types";
import { parseOnboardingState } from "./state";

export async function updateProjectOnboardingState(
  projectId: string,
  patch: Partial<OnboardingState> & { markCompleted?: boolean; markSkipped?: boolean },
): Promise<OnboardingState> {
  const { data: row, error: readErr } = await supabase
    .from("projects")
    .select("onboarding_state")
    .eq("id", projectId)
    .maybeSingle();

  if (readErr) throw readErr;

  const current = parseOnboardingState(
    (row as { onboarding_state?: unknown } | null)?.onboarding_state,
  );
  const next: OnboardingState = {
    ...current,
    ...patch,
    routeSteps: { ...current.routeSteps, ...patch.routeSteps },
  };

  if (patch.markSkipped) {
    next.skippedAt = new Date().toISOString();
    next.currentStep = "completed";
  }
  if (patch.markCompleted) {
    next.completedAt = new Date().toISOString();
    next.currentStep = "completed";
  }

  const payload: Record<string, unknown> = {
    onboarding_state: next,
    updated_at: new Date().toISOString(),
  };
  if (patch.markCompleted || patch.markSkipped) {
    payload.onboarding_completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from("projects").update(payload).eq("id", projectId);
  if (error) throw error;

  const title = patch.markSkipped
    ? "Онбординг пропущен"
    : patch.markCompleted
      ? "Онбординг завершён"
      : patch.quickWinLaunchedAt
        ? "Запущен первый сценарий"
        : "Шаг онбординга";

  await supabase.from("project_events").insert({
    project_id: projectId,
    event_type: "onboarding_progress",
    title,
    metadata: {
      step: next.currentStep,
      quick_win: next.quickWinScenarioId,
    },
  }).then(({ error: evErr }) => {
    if (evErr) console.warn("onboarding event:", evErr.message);
  });

  return next;
}

export async function syncRouteStepsFromActivity(
  projectId: string,
  state: OnboardingState,
  activity: { hasAudit?: boolean; hasPrototype?: boolean },
): Promise<OnboardingState> {
  const routeSteps = { ...state.routeSteps };
  if (activity.hasAudit) routeSteps.audit = "done";
  if (activity.hasPrototype) routeSteps.prototype = "done";
  if (routeSteps.project_card !== "done" && state.currentStep !== "welcome") {
    routeSteps.project_card = "done";
  }
  const changed = JSON.stringify(routeSteps) !== JSON.stringify(state.routeSteps);
  if (!changed) return state;
  return updateProjectOnboardingState(projectId, { routeSteps });
}
