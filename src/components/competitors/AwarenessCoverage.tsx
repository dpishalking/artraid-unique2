import type { AwarenessCoverageArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LEVEL_RU: Record<string, string> = {
  unaware: "Unaware",
  problem: "Problem-aware",
  solution: "Solution-aware",
  product: "Product-aware",
  most: "Most-aware",
};

type Props = { data: AwarenessCoverageArtifact };

export function AwarenessCoverage({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Awareness Coverage</CardTitle>
        <p className="text-xs text-muted-foreground">Кто из игроков на каком уровне Schwartz Awareness</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.segments.map((seg) => (
          <div
            key={seg.level}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
              seg.is_empty ? "border-dashed border-primary/30 bg-primary/5" : "border-border/60"
            }`}
          >
            <span className="font-medium">{LEVEL_RU[seg.level] ?? seg.level}</span>
            {seg.is_empty ? (
              <Badge variant="outline" className="text-[10px]">
                Пустая зона
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">{seg.competitor_ids.length} игрок(ов)</span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
