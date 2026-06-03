import { cn } from "@/lib/utils";

export type ReportTab = { id: string; label: string };

type Props<T extends string> = {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
};

export function ReportTabStrip<T extends string>({ tabs, active, onChange, className }: Props<T>) {
  return (
    <div
      className={cn(
        "-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none snap-x snap-mandatory",
        "lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0",
        className,
      )}
      role="tablist"
      aria-label="Части отчёта"
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={active === t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "min-w-[9.5rem] shrink-0 snap-start rounded-2xl border-2 px-4 py-3 text-center text-sm font-bold transition-colors sm:min-w-[10.5rem] sm:py-3.5 sm:text-[15px] lg:min-w-0",
            active === t.id
              ? "border-primary bg-primary/15 text-foreground shadow-sm"
              : "border-border/50 bg-card/60 text-muted-foreground hover:border-primary/35 hover:bg-card/75 hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
