import { motion } from "framer-motion";
import { Clock, Coins, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QUICK_WIN_SCENARIOS } from "@/lib/onboarding/constants";
import type { QuickWinScenarioId } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";
import { CREDITS_ENABLED } from "@/config/features";

type Props = {
  recommendedId: QuickWinScenarioId;
  onLaunch: (id: QuickWinScenarioId) => void;
  onBack: () => void;
  onSkipToRoute: () => void;
};

export function OnboardingQuickWinStep({ recommendedId, onLaunch, onBack, onSkipToRoute }: Props) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">Первый быстрый результат</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-2">Что хотите усилить первым?</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Рекомендуем сценарий на основе ваших ответов в квизе. Можно выбрать любой другой.
        </p>
      </div>

      <div className="space-y-3">
        {QUICK_WIN_SCENARIOS.map((scenario) => {
          const recommended = scenario.id === recommendedId;
          return (
            <div
              key={scenario.id}
              className={cn(
                "rounded-2xl border p-4 transition-all",
                recommended
                  ? "border-primary/50 bg-primary/5 shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)]"
                  : "border-border bg-card/60 hover:border-primary/30",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                {recommended ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    <Star className="h-3 w-3" />
                    Рекомендовано для вас
                  </span>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {scenario.durationLabel}
                  </span>
                  {(CREDITS_ENABLED || scenario.credits > 0) && (
                    <span className="inline-flex items-center gap-1">
                      <Coins className="h-3.5 w-3.5" />
                      {scenario.credits === 0 ? "Бесплатно" : `${scenario.credits} кред.`}
                    </span>
                  )}
                </div>
              </div>
              <h3 className="font-semibold text-foreground mt-2">{scenario.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
              <p className="text-xs text-muted-foreground/90 mt-2 flex items-start gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                {scenario.result}
              </p>
              <Button
                className={cn(
                  "mt-4 w-full sm:w-auto",
                  recommended && "bg-gradient-money text-primary-foreground shadow-glow",
                )}
                variant={recommended ? "default" : "outline"}
                onClick={() => onLaunch(scenario.id)}
              >
                Запустить
              </Button>
              {CREDITS_ENABLED && scenario.credits > 0 && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Стоимость: {scenario.credits} кредита. Результат сохранится в проекте.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3">
        <Button variant="ghost" onClick={onBack}>
          Назад
        </Button>
        <Button variant="outline" onClick={onSkipToRoute}>
          Пропустить → к маршруту
        </Button>
      </div>
    </motion.div>
  );
}
