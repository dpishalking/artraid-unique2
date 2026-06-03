import { Link } from "react-router-dom";
import { BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHypothesisLab } from "@/components/hypotheses/HypothesisLabProvider";
import { SectionHeader } from "@/components/hypotheses/lab/shared";
import { parseHypothesisResult } from "@/lib/hypotheses/api";
import { hypothesisLabBase } from "@/lib/hypotheses/labNav";

export function HypothesisLabResultsView() {
  const ctx = useHypothesisLab();
  const base = hypothesisLabBase(ctx.projectId);

  if (ctx.knowledge.length === 0 && ctx.rejected.length === 0) {
    return (
      <div>
        <SectionHeader
          title="Итоги"
          description="Зафиксированные инсайты, решения Scale / Pivot / Stop и карточки побед."
        />
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-money/10 text-money">
            <BookOpen className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Пока нет завершённых тестов. После внедрения зафиксируйте результат — он попадёт сюда.
          </p>
          <Button asChild variant="outline">
            <Link to={`${base}/tests`}>Перейти к тестам</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Итоги"
        description="База знаний проекта — что сработало, что нет, и что делать дальше."
      />

      {ctx.knowledge.length > 0 && (
        <section className="mb-8">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            База знаний · {ctx.knowledge.length}
          </p>
          <ul className="space-y-2">
            {ctx.knowledge.map((h) => {
              const parsed = parseHypothesisResult(h);
              return (
                <li
                  key={h.id}
                  className="rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm space-y-1"
                >
                  <p className="font-medium">{h.title}</p>
                  {parsed.decision && (
                    <p className="text-xs text-primary uppercase font-medium">
                      Итог: {parsed.decision}
                    </p>
                  )}
                  {parsed.insight && (
                    <p className="text-xs text-muted-foreground">Инсайт: {parsed.insight}</p>
                  )}
                  {parsed.nextAction && (
                    <p className="text-xs text-muted-foreground">Дальше: {parsed.nextAction}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {ctx.rejected.length > 0 && (
        <section>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Отложенные · {ctx.rejected.length}
          </p>
          <ul className="space-y-2">
            {ctx.rejected.map((h) => (
              <li
                key={h.id}
                className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm text-muted-foreground"
              >
                {h.title}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8">
        <Button asChild variant="outline" size="sm">
          <Link to={`${base}/generate`}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Следующая гипотеза
          </Link>
        </Button>
      </div>
    </div>
  );
}
