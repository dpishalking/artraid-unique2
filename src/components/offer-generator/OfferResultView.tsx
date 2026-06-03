import { CopyButton } from "./CopyButton";
import { OfferBestCard } from "./OfferBestCard";
import { OfferStrategy } from "./OfferStrategy";
import { OfferAngles } from "./OfferAngles";
import { OfferFormatTabs } from "./OfferFormatTabs";
import { OfferFourUScore } from "./OfferFourUScore";
import { OfferActions } from "./OfferActions";
import { OfferPrototypeBanner } from "./OfferPrototypeBanner";
import type { OfferBrief, OfferResult } from "@/lib/offer-generator/types";

type Props = {
  brief: OfferBrief;
  result: OfferResult;
  projectId?: string;
  onRegenerate: () => void;
  onRestart: () => void;
  loading?: boolean;
};

export function OfferResultView({ brief, result, projectId, onRegenerate, onRestart, loading }: Props) {
  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      <OfferActions
        result={result}
        onRegenerate={onRegenerate}
        onRestart={onRestart}
        loading={loading}
      />

      <OfferPrototypeBanner brief={brief} result={result} projectId={projectId} />

      <OfferBestCard result={result} />

      <OfferStrategy result={result} />

      {result.whyItWorks.length > 0 && (
        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <h2 className="font-display text-xl md:text-2xl font-bold mb-4">Почему этот оффер работает</h2>
          <ul className="space-y-2">
            {result.whyItWorks.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm md:text-base leading-relaxed">
                <span className="text-primary font-bold shrink-0">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <OfferAngles result={result} />
      <OfferFormatTabs result={result} />
      <OfferFourUScore result={result} />

      {result.improvements.length > 0 && (
        <section className="rounded-2xl border border-border bg-card/60 p-6">
          <h2 className="font-display text-xl md:text-2xl font-bold mb-4">Как усилить</h2>
          <ul className="space-y-2">
            {result.improvements.map((item, i) => (
              <li key={i} className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {i + 1}. {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(result.alternativeHeadlines.length > 0 || result.alternativeCtas.length > 0) && (
        <section className="rounded-2xl border border-border bg-card/60 p-6 space-y-6">
          <h2 className="font-display text-xl md:text-2xl font-bold">Дополнительные варианты</h2>
          {result.alternativeHeadlines.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Альтернативные заголовки</h3>
              <ol className="space-y-2">
                {result.alternativeHeadlines.map((h, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/30 px-3 py-2">
                    <span className="text-sm md:text-base">{h}</span>
                    <CopyButton text={h} />
                  </li>
                ))}
              </ol>
            </div>
          )}
          {result.alternativeCtas.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Альтернативные CTA</h3>
              <ol className="space-y-2">
                {result.alternativeCtas.map((c, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-border/60 bg-background/30 px-3 py-2">
                    <span className="text-sm md:text-base">{c}</span>
                    <CopyButton text={c} />
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      <OfferActions
        result={result}
        onRegenerate={onRegenerate}
        onRestart={onRestart}
        loading={loading}
      />
    </div>
  );
}
