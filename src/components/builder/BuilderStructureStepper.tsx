import { Check, Layers } from "lucide-react";
import type { LandingScenario } from "@/config/landingScenarios";
import { getActiveStructureIndex } from "@/lib/builderProgress";
import { builderMuted, builderStepLabel, builderSubpanel } from "@/components/builder/builderStyles";

type Props = {
  scenario: LandingScenario;
  questionIndex: number;
  questionCount: number;
  isFinalStep: boolean;
  compact?: boolean;
};

export function BuilderStructureStepper({
  scenario,
  questionIndex,
  questionCount,
  isFinalStep,
  compact,
}: Props) {
  const blocks = scenario.landingStructure;
  const activeIdx = getActiveStructureIndex(scenario, questionIndex, questionCount, isFinalStep);

  if (blocks.length === 0) return null;

  return (
    <div className={`${builderSubpanel} ${compact ? "px-3 py-3" : "px-4 py-4"}`}>
      <div className="flex items-center gap-2 mb-3">
        <Layers className="h-4 w-4 text-primary shrink-0" />
        <span className={builderStepLabel}>Структура лендинга</span>
        <span className={`text-xs ${builderMuted} ml-auto truncate max-w-[140px]`}>{scenario.title}</span>
      </div>

      <div className={compact ? "flex gap-2 overflow-x-auto pb-1" : "grid gap-2 sm:grid-cols-2 lg:grid-cols-1"}>
        {blocks.map((block, i) => {
          const isDone = isFinalStep ? true : i < activeIdx;
          const isActive = i === activeIdx && !isFinalStep;

          return (
            <div
              key={block.id}
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 shrink-0 ${
                compact ? "min-w-[160px]" : ""
              } ${
                isActive
                  ? "border-primary/50 bg-primary/10 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.5)]"
                  : isDone
                    ? "border-money/30 bg-money/5"
                    : "border-border bg-secondary/40"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isDone
                    ? "bg-money/20 text-money"
                    : isActive
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={`text-xs font-semibold leading-tight ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  {block.title}
                </p>
                {!compact && (
                  <p className={`text-[10px] ${builderMuted} mt-0.5 line-clamp-2`}>{block.goal}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
