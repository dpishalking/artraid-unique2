import { Link, useLocation } from "react-router-dom";
import { ideaLabDashboardPath, isIdeaLabRegisterRoute } from "@/lib/ideaLab/constants";
import { Lightbulb } from "lucide-react";
import { IdeaLabAccountChip } from "@/components/ideaLab/IdeaLabAccountChip";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ideaLabHostLabel } from "@/lib/navigation/ideaLabUrls";

/** Верхняя полоса сервиса Idea Lab — только навигация внутри сервиса. */
export function IdeaLabTopBar() {
  const { pathname } = useLocation();
  const onRegister = isIdeaLabRegisterRoute(pathname);

  const brand = (
    <>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-600/90 via-amber-500 to-amber-400/90 text-stone-950 shadow-[0_0_20px_-4px_hsl(43_90%_50%/0.6)]">
        <Lightbulb className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <span className="min-w-0 leading-tight hidden sm:block">
        <span className="block truncate font-display text-base tracking-tight">Idea Lab</span>
        <span className="block truncate text-[9px] font-semibold uppercase tracking-[0.28em] text-amber-500/70">
          Private workspace
        </span>
      </span>
    </>
  );

  return (
    <header className="sticky top-0 z-40 grid h-14 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-xl md:px-8">
      {onRegister ? (
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="inline-flex min-w-0 items-center gap-3 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
        >
          {brand}
        </a>
      ) : (
        <Link
          to={ideaLabDashboardPath()}
          className="inline-flex min-w-0 items-center gap-3 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
        >
          {brand}
        </Link>
      )}

      <span className="hidden truncate text-center text-[11px] text-muted-foreground/75 sm:block md:text-xs">
        {ideaLabHostLabel()}
      </span>

      <div className="flex items-center justify-end gap-2">
        <ThemeToggle variant="segmented" />
        <IdeaLabAccountChip />
      </div>
    </header>
  );
}
