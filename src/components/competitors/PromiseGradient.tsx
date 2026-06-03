import type { PromiseGradientArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { data: PromiseGradientArtifact };

export function PromiseGradient({ data }: Props) {
  const maxIntensity = Math.max(...data.rows.map((r) => r.intensity), 100);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Promise Gradient</CardTitle>
        <p className="text-xs text-muted-foreground">
          Жёсткость обещания: от мягкого «поможем разобраться» до «+200% за 30 дней»
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.rows.map((row) => (
          <div key={row.competitor_id} className="space-y-1">
            <div className="flex justify-between text-xs gap-2">
              <span className="font-medium truncate">
                {row.label}
                {row.is_self && (
                  <Badge variant="secondary" className="ml-1 text-[9px]">
                    вы
                  </Badge>
                )}
              </span>
              <span className="text-muted-foreground tabular-nums shrink-0">{row.intensity}/100</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${row.is_self ? "bg-primary" : "bg-muted-foreground/40"}`}
                style={{ width: `${(row.intensity / maxIntensity) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{row.promise}</p>
          </div>
        ))}
        {data.vacuum_zones.length > 0 && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
            <p className="font-semibold">Vacuum zones</p>
            <ul className="mt-1 text-muted-foreground list-disc pl-4 space-y-0.5">
              {data.vacuum_zones.map((z, i) => (
                <li key={i}>
                  {z.from}–{z.to}: {z.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
