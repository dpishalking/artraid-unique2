import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OnboardingState } from "@/lib/onboarding/types";
import { isOnboardingActive } from "@/lib/onboarding/state";

type Props = {
  projectId: string;
  quizCompleted: boolean;
  onboardingCompletedAt: string | null;
  state: OnboardingState;
};

export function OnboardingResumeBanner({
  projectId,
  quizCompleted,
  onboardingCompletedAt,
  state,
}: Props) {
  if (!isOnboardingActive(quizCompleted, onboardingCompletedAt, state)) return null;

  const step = state.currentStep;
  const label =
    step === "welcome"
      ? "Продолжить настройку проекта"
      : step === "project_card"
        ? "Дополнить карточку проекта"
        : step === "quick_win" || step === "wow_result"
          ? "Получить первый результат"
          : "Открыть маршрут усиления";

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm">Онбординг не завершён</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Система уже знает ваш проект — осталось пройти пару шагов для первого результата.
          </p>
        </div>
      </div>
      <Button size="sm" className="bg-gradient-money text-primary-foreground shrink-0" asChild>
        <Link to={`/projects/${projectId}/onboarding`}>{label}</Link>
      </Button>
    </div>
  );
}
