import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, LineChart, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCommercialMetricsSnapshot } from "@/lib/commercial/api";
import { calculateMetricStatus } from "@/lib/commercial/status";
import { TrafficLight } from "@/components/commercial/shared";

type Props = {
  projectId: string;
};

export function CommercialMetricsWidget({ projectId }: Props) {
  const [loading, setLoading] = useState(true);
  const [atRiskCount, setAtRiskCount] = useState(0);
  const [primaryCount, setPrimaryCount] = useState(0);
  const [topRisk, setTopRisk] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCommercialMetricsSnapshot(projectId)
      .then((snap) => {
        if (cancelled) return;
        const visible = snap.metrics.filter((m) => !m.is_hidden);
        const enriched = visible.map((m) => ({ ...m, status: calculateMetricStatus(m) }));
        const risk = enriched.filter((m) => m.status === "red" || m.status === "yellow");
        setAtRiskCount(risk.length);
        setPrimaryCount(visible.filter((m) => m.is_primary).length);
        setTopRisk(risk[0]?.name ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setAtRiskCount(0);
          setPrimaryCount(0);
          setTopRisk(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const summary = useMemo(() => {
    if (loading) return "Загрузка…";
    if (atRiskCount > 0) return `${atRiskCount} в зоне риска${topRisk ? `: ${topRisk}` : ""}`;
    if (primaryCount > 0) return `${primaryCount} главных метрик отслеживаются`;
    return "Заполните план и факт по ключевым показателям";
  }, [loading, atRiskCount, primaryCount, topRisk]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <LineChart className="h-4 w-4 text-primary" />
          Коммерческие метрики
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{summary}</p>
            {atRiskCount > 0 && topRisk && (
              <div className="flex items-center gap-2 text-xs">
                <TrafficLight status="red" />
                <span>{topRisk}</span>
              </div>
            )}
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to={`/projects/${projectId}/commercial-metrics`}>
                Открыть метрики
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
