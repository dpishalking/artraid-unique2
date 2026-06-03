import type { CtaInventoryArtifact } from "@/lib/competitors/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { data: CtaInventoryArtifact };

export function CtaInventory({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">CTA Inventory</CardTitle>
        <p className="text-xs text-muted-foreground">Глаголы и формулировки призывов на первом экране</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {data.items.map((item) => (
            <li
              key={`${item.competitor_id}-${item.cta_text}`}
              className={`flex flex-wrap items-center gap-2 text-sm ${item.is_self ? "text-primary" : ""}`}
            >
              <span className="font-medium min-w-[100px]">{item.label}</span>
              <span className="text-muted-foreground">«{item.cta_text}»</span>
              {item.verb && (
                <Badge variant="outline" className="text-[10px] font-mono">
                  {item.verb}
                </Badge>
              )}
            </li>
          ))}
        </ul>
        {(data.cliche_verbs.length > 0 || data.unique_to_you.length > 0) && (
          <div className="grid gap-2 sm:grid-cols-2 text-xs">
            {data.cliche_verbs.length > 0 && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="font-semibold text-amber-700 dark:text-amber-400">Cliché-глаголы</p>
                <p className="mt-1 text-muted-foreground">{data.cliche_verbs.join(" · ")}</p>
              </div>
            )}
            {data.unique_to_you.length > 0 && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">Только у вас</p>
                <p className="mt-1 text-muted-foreground">{data.unique_to_you.join(" · ")}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
