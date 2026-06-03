import { forwardRef } from "react";
import type { LossMapData } from "@/lib/loss-map/types";
import { getCurrentSiteHost } from "@/constants/site";

const BAR_COLORS: Record<string, string> = {
  offer: "bg-gradient-to-r from-[hsl(142_70%_50%)] to-[hsl(45_95%_58%)]",
  trust: "bg-[hsl(45_95%_58%)]",
  form: "bg-[hsl(24_95%_55%)]",
  speed: "bg-[hsl(270_70%_65%)]",
};

type Props = {
  data: LossMapData;
};

export const LossMapCard = forwardRef<HTMLDivElement, Props>(function LossMapCard({ data }, ref) {
  return (
    <div
      ref={ref}
      data-share-card
      className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card p-6 shadow-[0_20px_60px_-24px_hsl(var(--primary)/0.45)] md:p-8"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-money/20 blur-3xl" />

      <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Карта потерь заявок</p>
        <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {data.hostname}
        </h3>
        <p className="mt-2 text-sm text-foreground/85 leading-relaxed">{data.headline}</p>

        <div className="mt-5 inline-flex flex-wrap items-baseline gap-2 rounded-xl border-2 border-destructive/50 bg-destructive/15 px-4 py-2.5">
          <span className="text-xs font-medium text-destructive">Оценка недополученных заявок</span>
          <span className="font-display text-2xl font-black text-destructive">{data.totalLossLabel}</span>
        </div>

        <div className="mt-8 space-y-5">
          {data.categories.map((cat) => (
            <div key={cat.id}>
              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                <span className="font-semibold text-foreground">
                  {cat.label}
                  <span className="ml-2 text-xs font-normal text-foreground/65">{cat.hint}</span>
                </span>
                <span className="tabular-nums text-base font-bold text-primary">−{cat.percent}%</span>
              </div>
              <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/15 ring-1 ring-white/10">
                <div
                  className={`h-full min-w-[8%] rounded-full ${BAR_COLORS[cat.id] ?? "bg-primary"}`}
                  style={{ width: `${Math.max(cat.percent, 6)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {data.topFixes.length > 0 && (
          <div className="mt-8 rounded-2xl border border-border/60 bg-secondary/40 p-4 md:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Топ-3 правки</p>
            <ol className="mt-3 space-y-3">
              {data.topFixes.map((fix, i) => (
                <li key={i} className="flex gap-3 text-sm leading-snug text-foreground">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/25 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span>{fix}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-foreground/55">
          {getCurrentSiteHost()} · AI-аудит маркетинга
        </p>
      </div>
    </div>
  );
});
