import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import type { GrowthCycleStep } from "@/lib/growthCycle/routes";
import { GROWTH_CYCLE_STEPS } from "@/lib/growthCycle/routes";

type Props = {
  active: GrowthCycleStep;
  onChange: (step: GrowthCycleStep) => void;
  completedThrough?: GrowthCycleStep;
};

const ORDER: GrowthCycleStep[] = ["audit", "hypotheses", "implement", "results"];

function stepIndex(id: GrowthCycleStep): number {
  return ORDER.indexOf(id);
}

export function GrowthCycleStepNav({ active, onChange, completedThrough }: Props) {
  const completedIdx = completedThrough ? stepIndex(completedThrough) : -1;

  return (
    <nav
      className="mb-8 flex gap-1 overflow-x-auto pb-1 sm:grid sm:grid-cols-4 sm:overflow-visible"
      aria-label="Шаги цикла внедрения"
    >
      {GROWTH_CYCLE_STEPS.map((step, i) => {
        const isActive = active === step.id;
        const isDone = i <= completedIdx && !isActive;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onChange(step.id)}
            className={cn(
              "flex min-w-[132px] flex-col rounded-xl border px-3 py-2.5 text-left transition-colors sm:min-w-0",
              isActive
                ? "border-primary/50 bg-primary/10 shadow-sm"
                : isDone
                  ? "border-money/30 bg-money/5 hover:border-money/50"
                  : "border-border/60 bg-card/40 hover:border-border hover:bg-card/60",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-money/20 text-money"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className="text-xs font-semibold">{step.label}</span>
            </div>
            <p className="mt-1 pl-7 text-[11px] text-muted-foreground">{step.short}</p>
          </button>
        );
      })}
    </nav>
  );
}
