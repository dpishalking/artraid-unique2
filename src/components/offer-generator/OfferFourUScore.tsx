import { Progress } from "@/components/ui/progress";
import type { OfferResult } from "@/lib/offer-generator/types";

const ITEMS: {
  key: keyof OfferResult["fourUScore"];
  label: string;
}[] = [
  { key: "useful", label: "Полезность" },
  { key: "urgent", label: "Срочность" },
  { key: "unique", label: "Уникальность" },
  { key: "ultraSpecific", label: "Конкретность" },
];

type Props = { result: OfferResult };

export function OfferFourUScore({ result }: Props) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-6">
      <h2 className="font-display text-xl md:text-2xl font-bold mb-6">Проверка по 4U</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        {ITEMS.map(({ key, label }) => {
          const item = result.fourUScore[key];
          const score = Math.min(10, Math.max(1, item?.score ?? 5));
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="tabular-nums font-bold text-primary">{score}/10</span>
              </div>
              <Progress value={score * 10} className="h-2" />
              {item?.comment && (
                <p className="text-xs text-muted-foreground leading-relaxed">{item.comment}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
