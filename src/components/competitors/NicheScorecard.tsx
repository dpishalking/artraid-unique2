import type { ScorecardArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = { data: ScorecardArtifact };

export function NicheScorecard({ data }: Props) {
  const maxVal = Math.max(
    ...data.you,
    ...data.median,
    ...data.top,
    100,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Scorecard: Hormozi Value Equation</CardTitle>
        <p className="text-xs text-muted-foreground">Вы vs медиана ниши vs лучший конкурент</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.axes.map((axis, i) => (
          <div key={axis} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium">{axis}</span>
              <span className="text-muted-foreground tabular-nums">
                вы {data.you[i]} · мед. {data.median[i]} · топ {data.top[i]}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-muted-foreground/25 rounded-full"
                style={{ width: `${(data.median[i] / maxVal) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-emerald-500/40 rounded-full"
                style={{ width: `${(data.top[i] / maxVal) * 100}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full"
                style={{ width: `${(data.you[i] / maxVal) * 100}%` }}
              />
            </div>
          </div>
        ))}
        <div className="flex gap-4 text-[10px] text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded bg-primary" /> Вы
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded bg-muted-foreground/25" /> Медиана
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-3 rounded bg-emerald-500/40" /> Топ
          </span>
        </div>
        {data.commentary && (
          <p className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">
            {data.commentary}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
