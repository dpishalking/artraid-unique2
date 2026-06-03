import type { PricingIntelligenceArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const LADDER_RU: Record<string, string> = {
  below_median: "Ниже медианы ниши",
  at_median: "На уровне медианы",
  above_median: "Выше медианы",
  unknown: "Недостаточно данных",
};

const MODEL_RU: Record<string, string> = {
  one_off: "Разовая",
  subscription: "Подписка",
  packages: "Пакеты",
  freemium: "Freemium",
  on_request: "По запросу",
};

type Props = { data: PricingIntelligenceArtifact };

export function PricingIntelligence({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Pricing Intelligence</CardTitle>
        <p className="text-xs text-muted-foreground">
          {data.median_price_label
            ? `Медиана ниши: ${data.median_price_label} · ${LADDER_RU[data.ladder_position]}`
            : LADDER_RU[data.ladder_position]}
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {data.rows.map((row) => (
            <li
              key={row.competitor_id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 ${row.is_self ? "border-primary/40 bg-primary/5" : ""}`}
            >
              <span className="font-medium">
                {row.label}
                {row.is_self && (
                  <Badge variant="secondary" className="ml-1 text-[9px]">
                    вы
                  </Badge>
                )}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {row.extracted_price ?? "—"}
                {row.pricing_model && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {MODEL_RU[row.pricing_model] ?? row.pricing_model}
                  </Badge>
                )}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
