import { useCallback, useEffect, useMemo, useState } from "react";
import { useWizardStepHistory } from "@/hooks/useWizardStepHistory";
import { onboardingStepFromIndex, onboardingStepToIndex } from "@/lib/navigation/wizardSteps";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { OnboardingWelcomeStep } from "@/components/onboarding/steps/WelcomeStep";
import { OnboardingProjectCardStep } from "@/components/onboarding/steps/ProjectCardStep";
import { OnboardingQuickWinStep } from "@/components/onboarding/steps/QuickWinStep";
import { OnboardingWowResultStep } from "@/components/onboarding/steps/WowResultStep";
import { OnboardingFirstStepsStep } from "@/components/onboarding/steps/FirstStepsStep";
import {
  getProjectActivitySummary,
  getProjectById,
} from "@/lib/projects/projectApi";
import { getProjectMemoryRow } from "@/lib/projectMemory/api";
import { mergeStoredMemoryIntoSections } from "@/lib/projectMemory/mergeSections";
import { mainGoalLabel } from "@/lib/projects/constants";
import type { Project } from "@/lib/projects/types";
import { updateProjectOnboardingState, syncRouteStepsFromActivity } from "@/lib/onboarding/api";
import { buildProjectCardFields } from "@/lib/onboarding/projectCardFields";
import { recommendQuickWinScenario, getQuickWinScenario } from "@/lib/onboarding/recommendScenario";
import {
  isOnboardingActive,
  onboardingProgressStepIndex,
  parseOnboardingState,
} from "@/lib/onboarding/state";
import type { OnboardingState, OnboardingStepId, QuickWinScenarioId } from "@/lib/onboarding/types";

export default function ProjectOnboardingPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [cardFields, setCardFields] = useState<ReturnType<typeof buildProjectCardFields>>([]);
  const [hasActivity, setHasActivity] = useState(false);

  const stepOverride = searchParams.get("step") as OnboardingStepId | null;

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [data, memRow, activity] = await Promise.all([
        getProjectById(projectId),
        getProjectMemoryRow(projectId),
        getProjectActivitySummary(projectId),
      ]);
      if (!data) {
        toast.error("Проект не найден");
        nav("/cabinet");
        return;
      }
      const parsed = parseOnboardingState(data.project.onboarding_state);
      const synced = await syncRouteStepsFromActivity(projectId, parsed, {
        hasAudit: activity?.hasAudit,
        hasPrototype: activity?.hasPrototype,
      });
      setState(synced);
      setProject(data.project);
      setHasActivity(Boolean(activity?.hasAudit || activity?.hasPrototype));
      setCompletionPercent(memRow?.completion_percent ?? 0);
      const memory = memRow
        ? mergeStoredMemoryIntoSections(memRow as unknown as Record<string, unknown>)
        : null;
      setCardFields(
        buildProjectCardFields(
          data.project,
          data.context,
          memory,
          data.project.quiz_answers_snapshot,
        ),
      );

      if (
        !isOnboardingActive(
          data.project.quiz_completed,
          data.project.onboarding_completed_at,
          synced,
        ) &&
        !stepOverride
      ) {
        nav(`/projects/${projectId}`, { replace: true });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить онбординг");
    } finally {
      setLoading(false);
    }
  }, [projectId, nav, stepOverride]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentStep: OnboardingStepId = useMemo(() => {
    if (stepOverride && stepOverride !== "completed") return stepOverride;
    return state?.currentStep ?? "welcome";
  }, [state, stepOverride]);

  const recommendedId = useMemo(
    () => (project ? recommendQuickWinScenario(project) : ("offer" as QuickWinScenarioId)),
    [project],
  );

  const usedContextLines = useMemo(() => {
    if (!project) return ["данные из квиза и карточки проекта"];
    const lines: string[] = [];
    if (project.product_description) {
      lines.push(`Продукт: ${project.product_description.slice(0, 80)}…`);
    }
    if (project.target_audience) {
      lines.push(`Аудитория: ${project.target_audience.slice(0, 80)}…`);
    }
    if (project.current_website_url) lines.push(`Сайт: ${project.current_website_url}`);
    lines.push(`Цель: ${mainGoalLabel(project.main_goal)}`);
    return lines;
  }, [project]);

  const goStep = async (step: OnboardingStepId, extra?: Partial<OnboardingState>) => {
    if (!projectId) return;
    const next = await updateProjectOnboardingState(projectId, {
      currentStep: step,
      ...extra,
    });
    setState(next);
  };

  const onboardingIndex = onboardingStepToIndex(currentStep);
  const applyOnboardingIndex = useCallback(
    (i: number) => {
      const next = onboardingStepFromIndex(i);
      if (next) void goStep(next);
    },
    [goStep],
  );
  useWizardStepHistory(onboardingIndex ?? 0, applyOnboardingIndex, {
    enabled: onboardingIndex !== null && !loading && Boolean(state),
  });

  const handleSkip = async () => {
    if (!projectId) return;
    await updateProjectOnboardingState(projectId, { markSkipped: true });
    nav(`/projects/${projectId}`, { replace: true });
  };

  const handleLaunch = async (id: QuickWinScenarioId) => {
    if (!projectId || !project) return;
    const scenario = getQuickWinScenario(id);
    const routeKey =
      id === "offer" || id === "hero_variants"
        ? "offer"
        : id === "prototype"
          ? "prototype"
          : "audit";

    await updateProjectOnboardingState(projectId, {
      currentStep: "wow_result",
      quickWinScenarioId: id,
      quickWinLaunchedAt: new Date().toISOString(),
      routeSteps: { [routeKey]: "in_progress" },
    });

    nav(scenario.path(projectId));
  };

  if (loading || !state || !projectId || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const progressIndex = onboardingProgressStepIndex(currentStep);

  return (
    <OnboardingShell
      stepIndex={progressIndex}
      stepCount={4}
      projectId={projectId!}
      projectName={project.name}
    >
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => void handleSkip()}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Пропустить онбординг
        </button>
      </div>

      {currentStep === "welcome" && (
        <OnboardingWelcomeStep
          onStart={() => void goStep("project_card")}
          onSkip={() => void handleSkip()}
        />
      )}

      {currentStep === "project_card" && (
        <OnboardingProjectCardStep
          projectId={projectId}
          completionPercent={completionPercent}
          fields={cardFields}
          onBack={() => void goStep("welcome")}
          onNext={() => void goStep("quick_win", { routeSteps: { project_card: "done" } })}
        />
      )}

      {currentStep === "quick_win" && (
        <OnboardingQuickWinStep
          recommendedId={recommendedId}
          onLaunch={(id) => void handleLaunch(id)}
          onBack={() => void goStep("project_card")}
          onSkipToRoute={() => void goStep("first_steps")}
        />
      )}

      {currentStep === "wow_result" && state.quickWinScenarioId && (
        <OnboardingWowResultStep
          project={project}
          scenarioId={state.quickWinScenarioId}
          usedContextLines={usedContextLines}
          hasActivity={hasActivity}
          onContinue={() => void goStep("first_steps", { firstGenerationDone: true })}
        />
      )}

      {currentStep === "first_steps" && (
        <OnboardingFirstStepsStep
          projectId={projectId}
          routeSteps={state.routeSteps}
          onFinish={async () => {
            await updateProjectOnboardingState(projectId, { markCompleted: true });
            nav(`/projects/${projectId}`, { replace: true });
          }}
        />
      )}

      {currentStep === "completed" && (
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Онбординг завершён.</p>
          <Link to={`/projects/${projectId}`} className="text-primary hover:underline">
            Открыть проект →
          </Link>
        </div>
      )}
    </OnboardingShell>
  );
}
