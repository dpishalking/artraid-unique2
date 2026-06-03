import { Link } from "react-router-dom";
import { Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHypothesisLab } from "@/components/hypotheses/HypothesisLabProvider";
import { HypothesisRow, SectionHeader } from "@/components/hypotheses/lab/shared";
import { hypothesisLabBase } from "@/lib/hypotheses/labNav";

export function HypothesisLabActiveView() {
  const ctx = useHypothesisLab();
  const base = hypothesisLabBase(ctx.projectId);

  const inTest = ctx.active.filter(
    (h) => h.status === "selected" || h.status === "in_progress",
  );
  const awaitingDecision = ctx.active.filter(
    (h) => h.status === "implemented" || h.status === "won",
  );

  if (ctx.active.length === 0) {
    return (
      <div>
        <SectionHeader
          title="Тесты"
          description="Гипотезы с протоколом — внедряйте изменения и фиксируйте результат."
        />
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Play className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Нет активных тестов. Возьмите гипотезу из бэклога или сгенерируйте новую.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild variant="outline">
              <Link to={`${base}/backlog`}>Открыть бэклог</Link>
            </Button>
            <Button asChild className="bg-gradient-money text-primary-foreground">
              <Link to={`${base}/generate`}>
                <Sparkles className="mr-2 h-4 w-4" />
                Новая гипотеза
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Тесты"
        description="Внедряйте изменения, отмечайте прогресс и фиксируйте результат."
      />

      {inTest.length > 0 && (
        <section className="mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            В работе · {inTest.length}
          </p>
          <ul className="space-y-3">
            {inTest.map((h) => (
              <HypothesisRow
                key={h.id}
                hypothesis={h}
                onMarkProgress={() => ctx.handleStartProgress(h)}
                onMarkResult={() => ctx.setResultTarget(h)}
                onShowWin={() => ctx.showWinCard(h)}
                onEditProtocol={() => ctx.setProtocolTarget(h)}
              />
            ))}
          </ul>
        </section>
      )}

      {awaitingDecision.length > 0 && (
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Внедрено · нужен итог · {awaitingDecision.length}
          </p>
          <ul className="space-y-3">
            {awaitingDecision.map((h) => (
              <HypothesisRow
                key={h.id}
                hypothesis={h}
                onMarkProgress={() => ctx.handleStartProgress(h)}
                onMarkResult={() => ctx.setResultTarget(h)}
                onShowWin={() => ctx.showWinCard(h)}
                onEditProtocol={() => ctx.setProtocolTarget(h)}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
