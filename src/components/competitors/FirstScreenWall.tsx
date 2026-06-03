import type { FirstScreenWallArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { data: FirstScreenWallArtifact };

export function FirstScreenWall({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">First-screen wall</CardTitle>
        <p className="text-xs text-muted-foreground">
          Side-by-side первых экранов: заголовок, подзаголовок, CTA, доверие
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="pb-2 pr-3 font-medium">Сайт</th>
              <th className="pb-2 pr-3 font-medium">Заголовок</th>
              <th className="pb-2 pr-3 font-medium">Подзаголовок</th>
              <th className="pb-2 pr-3 font-medium">CTA</th>
              <th className="pb-2 font-medium">Trusts</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr
                key={row.competitor_id}
                className={`border-b border-border/60 align-top ${row.is_self ? "bg-primary/5" : ""}`}
              >
                <td className="py-3 pr-3 whitespace-nowrap">
                  <span className="font-medium">{row.label}</span>
                  {row.is_self && (
                    <Badge className="ml-1 text-[10px]" variant="secondary">
                      вы
                    </Badge>
                  )}
                </td>
                <td className="py-3 pr-3 max-w-[180px] text-xs">{row.headline ?? "—"}</td>
                <td className="py-3 pr-3 max-w-[180px] text-xs text-muted-foreground">
                  {row.sub_headline ?? "—"}
                </td>
                <td className="py-3 pr-3 text-xs">{row.primary_cta ?? "—"}</td>
                <td className="py-3 text-xs tabular-nums">{row.trust_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
