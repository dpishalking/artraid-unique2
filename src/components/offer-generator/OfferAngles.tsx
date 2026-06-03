import type { OfferResult } from "@/lib/offer-generator/types";
import { CopyButton } from "./CopyButton";

const ANGLE_LABELS: { key: keyof OfferResult["angles"]; title: string }[] = [
  { key: "pain", title: "Через боль" },
  { key: "result", title: "Через результат" },
  { key: "loss", title: "Через потерю" },
  { key: "enemy", title: "Через врага" },
  { key: "mechanism", title: "Через механизм" },
  { key: "diagnostic", title: "Через диагностику" },
  { key: "urgency", title: "Через срочность" },
];

type Props = { result: OfferResult };

export function OfferAngles({ result }: Props) {
  return (
    <section>
      <h2 className="font-display text-xl md:text-2xl font-bold mb-4">Углы оффера</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {ANGLE_LABELS.map(({ key, title }) => {
          const text = result.angles[key];
          if (!text?.trim()) return null;
          return (
            <div
              key={key}
              className="rounded-2xl border border-border bg-card/60 p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-sm">{title}</h3>
                <CopyButton text={text} />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
