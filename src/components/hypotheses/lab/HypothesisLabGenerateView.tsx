import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProblemHypothesisGenerator } from "@/components/hypotheses/ProblemHypothesisGenerator";
import { useHypothesisLab } from "@/components/hypotheses/HypothesisLabProvider";
import { SectionHeader } from "@/components/hypotheses/lab/shared";

export function HypothesisLabGenerateView() {
  const ctx = useHypothesisLab();
  const [searchParams] = useSearchParams();
  const initialMetricId = searchParams.get("metricId") ?? "";

  return (
    <div>
      <SectionHeader
        title="Новая гипотеза"
        description="Опишите проблему — AI предложит 3–5 тестируемых вариантов с метриками. Или добавьте вручную."
      />

      <ProblemHypothesisGenerator
        projectId={ctx.projectId}
        seedProblem={ctx.aiSeed?.problem}
        seedChannel={ctx.aiSeed?.channel}
        initialMetricId={initialMetricId}
        onClearSeed={() => ctx.setAiSeed(null)}
        onReload={ctx.reload}
        onConfigure={ctx.setProtocolTarget}
        compact
      />

      <div className="mt-6 pt-6 border-t border-border/60">
        <p className="text-sm text-muted-foreground mb-3">Или добавьте гипотезу вручную без AI</p>
        <Button variant="outline" onClick={() => ctx.setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить вручную
        </Button>
      </div>
    </div>
  );
}
