import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { listCommercialMetrics } from "@/lib/commercial/api";
import { getHypothesisDirections } from "@/lib/commercial/hypothesisDirections";
import type { CommercialMetric } from "@/lib/commercial/types";
import { COMMERCIAL_CATEGORY_LABELS } from "@/lib/commercial/types";

type Props = {
  projectId: string;
  value: string;
  onChange: (metricId: string, metric: CommercialMetric | null) => void;
  required?: boolean;
  onDirectionPick?: (direction: string) => void;
};

export function CommercialMetricSelector({
  projectId,
  value,
  onChange,
  required = false,
  onDirectionPick,
}: Props) {
  const [metrics, setMetrics] = useState<CommercialMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCommercialMetrics(projectId)
      .then((rows) => {
        if (!cancelled) setMetrics(rows);
      })
      .catch(() => {
        if (!cancelled) setMetrics([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const selected = metrics.find((m) => m.id === value) ?? null;
  const directions = selected
    ? getHypothesisDirections({
        slug: selected.slug,
        category: selected.category,
        name: selected.name,
      })
    : [];

  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label className="text-xs">
          Какую метрику должна улучшить эта гипотеза?{required ? " *" : ""}
        </Label>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Select
            value={value || undefined}
            onValueChange={(id) => onChange(id, metrics.find((m) => m.id === id) ?? null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите метрику проекта" />
            </SelectTrigger>
            <SelectContent>
              {metrics.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                  {" · "}
                  {COMMERCIAL_CATEGORY_LABELS[m.category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selected && directions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground">Типовые направления гипотез:</p>
          <div className="flex flex-wrap gap-1.5">
            {directions.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDirectionPick?.(d)}
                className="inline-flex"
              >
                <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80 text-xs font-normal">
                  {d}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
