import { cn } from "@/lib/utils";

export type BannerKey =
  | "summary"
  | "problems"
  | "blocks"
  | "leaks"
  | "growth"
  | "ba"
  | "waterfall"
  | "offer"
  | "market"
  | "meclabs"
  | "roadmap"
  | "system"
  | "cta";

const HERO_GRADIENT: Record<BannerKey, string> = {
  summary: "from-primary/15 via-card/80 to-money/10",
  problems: "from-destructive/12 via-card/70 to-background",
  blocks: "from-primary/12 via-card/70 to-background",
  leaks: "from-destructive/15 via-card/60 to-background",
  growth: "from-money/15 via-card/70 to-background",
  ba: "from-primary/12 via-card/70 to-money/8",
  waterfall: "from-money/12 via-card/70 to-primary/8",
  offer: "from-money/15 via-card/70 to-background",
  market: "from-primary/12 via-card/70 to-background",
  meclabs: "from-orange-500/10 via-card/70 to-background",
  roadmap: "from-money/15 via-card/70 to-primary/8",
  system: "from-primary/12 via-card/70 to-background",
  cta: "from-primary/20 via-card/80 to-money/12",
};

type Props = {
  kind: BannerKey;
  title: string;
  className?: string;
};

/** Лёгкая шапка секции вместо stock-баннера — спокойнее и «дороже» на вебе. */
export function ReportSectionHero({ kind, title, className }: Props) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br px-5 py-4 md:px-6 md:py-5",
        HERO_GRADIENT[kind],
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/90">
        Раздел отчёта
      </p>
      <p className="mt-1.5 font-display text-lg font-semibold tracking-tight text-foreground md:text-xl">
        {title}
      </p>
    </div>
  );
}
