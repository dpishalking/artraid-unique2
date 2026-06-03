import type { NicheSnapshotStrategies, NicheStrategy } from "@/lib/competitors/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const KIND_LABEL: Record<string, string> = {
  defensive: "Защитная",
  blind_spot: "Атакующая",
  new_category: "Фланговая",
};

function StrategyCard({
  kind,
  strategy,
  projectId,
}: {
  kind: string;
  strategy: NicheStrategy;
  projectId?: string;
}) {
  const offerUrl = projectId
    ? `/offer-generator?projectId=${projectId}&strategyHint=${encodeURIComponent(strategy.title)}`
    : "/offer-generator";

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="flex flex-col flex-1 pt-5 pb-5 space-y-4">
        <div className="space-y-2">
          <Badge variant="outline" className="text-[10px]">
            {KIND_LABEL[kind] ?? kind}
          </Badge>
          <h3 className="font-semibold text-base leading-snug">{strategy.title}</h3>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed flex-1">{strategy.rationale}</p>

        {strategy.what_to_change?.length > 0 && (
          <ol className="space-y-1.5 text-xs text-foreground/90">
            {strategy.what_to_change.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground shrink-0 w-4">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}

        <Button asChild size="sm" variant="outline" className="w-full mt-auto">
          <a href={offerUrl}>
            Сгенерировать оффер
            <ArrowRight className="h-3.5 w-3.5 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}

type Props = { strategies: NicheSnapshotStrategies; projectId?: string };

export function NicheStrategiesPanel({ strategies, projectId }: Props) {
  const items = (
    [
      ["blind_spot", strategies.blind_spot],
      ["new_category", strategies.new_category],
      ["defensive", strategies.defensive],
    ] as const
  ).filter(([, s]) => s != null);

  if (!items.length) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-semibold">Что делать дальше</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Три стратегии на основе карты ниши. Выберите одну и сгенерируйте оффер.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map(([kind, s]) =>
          s ? <StrategyCard key={kind} kind={kind} strategy={s} projectId={projectId} /> : null,
        )}
      </div>
    </div>
  );
}
