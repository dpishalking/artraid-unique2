import { CopyButton } from "./CopyButton";
import { formatBestOfferCopy } from "@/lib/offer-generator/formatters";
import type { OfferResult } from "@/lib/offer-generator/types";

type Props = {
  result: OfferResult;
};

function FieldRow({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="rounded-xl border border-border/80 bg-background/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
            {label}
          </p>
          <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">{value}</p>
        </div>
        <CopyButton text={value} />
      </div>
    </div>
  );
}

export function OfferBestCard({ result }: Props) {
  const { headline, subheadline, cta, microcopy } = result.bestOffer;

  return (
    <section className="rounded-2xl border border-primary/25 bg-card/80 p-6 md:p-8 shadow-[0_12px_40px_-20px_hsl(var(--primary)/0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold">Лучший оффер</h2>
        <CopyButton
          text={formatBestOfferCopy(result)}
          label="Скопировать весь оффер"
          variant="secondary"
        />
      </div>

      <div className="space-y-3">
        {headline && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 md:p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Заголовок</p>
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-2xl md:text-3xl font-bold leading-tight">{headline}</p>
              <CopyButton text={headline} />
            </div>
          </div>
        )}
        <FieldRow label="Подзаголовок" value={subheadline} />
        <FieldRow label="CTA" value={cta} />
        <FieldRow label="Микротекст" value={microcopy} />
      </div>
    </section>
  );
}
