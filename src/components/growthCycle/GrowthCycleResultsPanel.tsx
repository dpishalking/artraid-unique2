import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  listHypothesesForProject,
  parseHypothesisResult,
  type Hypothesis,
} from "@/lib/hypotheses/api";
import { growthCycleHref } from "@/lib/growthCycle/routes";

type Props = {
  projectId: string;
};

export function GrowthCycleResultsPanel({ projectId }: Props) {
  const [loading, setLoading] = useState(true);
  const [hypotheses, setHypotheses] = useState<Hypothesis[]>([]);

  const reload = useCallback(() => {
    return listHypothesesForProject(projectId)
      .then(setHypotheses)
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const knowledge = useMemo(
    () =>
      hypotheses.filter((h) => {
        const parsed = parseHypothesisResult(h);
        return (
          (h.status === "implemented" || h.status === "won") &&
          (parsed.decision || parsed.insight || parsed.nextAction)
        );
      }),
    [hypotheses],
  );

  const rejected = useMemo(
    () => hypotheses.filter((h) => h.status === "rejected"),
    [hypotheses],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Загружаем итоги…
      </div>
    );
  }

  if (knowledge.length === 0 && rejected.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-8 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-money/10 text-money">
          <BookOpen className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Пока нет зафиксированных результатов. Внедрите гипотезу из канбана и отметьте итог — он
          появится здесь.
        </p>
        <Button asChild variant="outline">
          <Link to={growthCycleHref(projectId, "implement")}>К канбану</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {knowledge.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Что сработало · {knowledge.length}
          </p>
          <ul className="space-y-2">
            {knowledge.map((h) => {
              const parsed = parseHypothesisResult(h);
              return (
                <li
                  key={h.id}
                  className="rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm space-y-1"
                >
                  <p className="font-medium">{h.title}</p>
                  {parsed.decision && (
                    <p className="text-xs font-medium uppercase text-primary">
                      Итог: {parsed.decision}
                    </p>
                  )}
                  {parsed.insight && (
                    <p className="text-muted-foreground">{parsed.insight}</p>
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

      {rejected.length > 0 && (
        <section>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Не пошло · {rejected.length}
          </p>
          <ul className="space-y-2">
            {rejected.map((h) => (
              <li
                key={h.id}
                className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3 text-sm text-muted-foreground"
              >
                {h.title}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
