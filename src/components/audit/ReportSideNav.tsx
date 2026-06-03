import { cn } from "@/lib/utils";

type NavItem<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  tabs: readonly NavItem<T>[];
  active: T;
  onChange: (id: T) => void;
};

/** Вертикальный sticky-рейл на десктопе — слева от контента отчёта. */
export function ReportSideNav<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <nav
      aria-label="Разделы отчёта"
      data-pdf-hide
      className="sticky top-24 hidden lg:block"
    >
      <ol className="space-y-3">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onChange(t.id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full border transition-all",
                    isActive
                      ? "border-money bg-money shadow-[0_0_0_4px_hsl(var(--money)/0.15)]"
                      : "border-border bg-transparent group-hover:border-money/60",
                  )}
                />
                <span className={cn("font-medium tracking-tight", isActive && "text-foreground")}>
                  {t.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
