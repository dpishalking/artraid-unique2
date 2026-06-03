import type { TrustMatrixArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CELL_CLASS: Record<string, string> = {
  strong: "bg-emerald-500/70",
  weak: "bg-amber-400/50",
  none: "bg-muted/40",
};

type Props = { data: TrustMatrixArtifact };

export function TrustMatrix({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Trust Matrix — Cialdini × 6</CardTitle>
        <p className="text-xs text-muted-foreground">Сильные триггеры доверия по каждому игроку</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-2 font-medium">Сайт</th>
              {data.triggers.map((t) => (
                <th key={t} className="pb-2 px-1 font-medium text-center max-w-[72px]">
                  {t}
                </th>
              ))}
              <th className="pb-2 pl-1 font-medium text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr
                key={row.competitor_id}
                className={cn("border-b border-border/60", row.is_self && "bg-primary/5")}
              >
                <td className="py-2 pr-2 whitespace-nowrap">
                  {row.label}
                  {row.is_self && (
                    <Badge variant="secondary" className="ml-1 text-[9px]">
                      вы
                    </Badge>
                  )}
                </td>
                {row.cells.map((cell, i) => (
                  <td key={i} className="py-2 px-1">
                    <div
                      className={cn("mx-auto h-5 w-5 rounded-sm", CELL_CLASS[cell] ?? CELL_CLASS.none)}
                      title={cell}
                    />
                  </td>
                ))}
                <td className="py-2 pl-1 text-right tabular-nums">{row.coverage_pct ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
