import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { landingScenarios } from "@/config/landingScenarios";
import { ScenarioVisual } from "@/components/builder/scenarioVisuals";
import {
  builderBody,
  builderCardGlow,
  builderHeading,
  builderMuted,
  builderScenarioTile,
  builderScenarioTileSelected,
  builderStepLabel,
  builderWorkspace,
  builderWorkspacePadding,
} from "@/components/builder/builderStyles";

type ScenarioPickerProps = {
  stepNumber: number;
  totalSteps: number;
  value: string;
  onChange: (id: string) => void;
  onNext: () => void;
};

export function ScenarioPicker({ stepNumber, totalSteps, value, onChange, onNext }: ScenarioPickerProps) {
  return (
    <div className={`${builderWorkspace} ${builderWorkspacePadding}`}>
      <div className={builderCardGlow} aria-hidden />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-mono ${builderMuted}`}>
            {stepNumber} / {totalSteps}
          </span>
          <span className={builderStepLabel}>Сценарий</span>
        </div>

        <h2 className={`${builderHeading} text-2xl md:text-3xl mb-2`}>Для чего вам нужен лендинг?</h2>
        <p className={`${builderBody} text-sm mb-6 leading-relaxed`}>
          Выберите сценарий — сервис соберёт структуру страницы под рекламу, презентацию продукта, проверку
          гипотезы, консультацию, продажу или вебинар.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {landingScenarios.map((scenario) => {
            const selected = value === scenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onChange(scenario.id)}
                className={`relative flex w-full flex-col px-4 py-4 ${
                  selected ? builderScenarioTileSelected : builderScenarioTile
                }`}
              >
                {selected && (
                  <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                )}
                <ScenarioVisual id={scenario.id} selected={selected} />
                <div className={`font-semibold pr-6 leading-snug ${selected ? "text-primary" : "text-foreground"}`}>
                  {scenario.title}
                </div>
                <p className={`text-sm ${builderBody} mt-1.5 leading-snug`}>{scenario.shortDescription}</p>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => {
              if (!value) {
                toast.error("Выберите сценарий лендинга, чтобы сервис собрал структуру под вашу задачу.");
                return;
              }
              onNext();
            }}
            className="flex-1 h-12 bg-gradient-money text-primary-foreground font-semibold shadow-glow"
          >
            Дальше <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
