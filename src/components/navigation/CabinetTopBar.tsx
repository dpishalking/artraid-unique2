import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { CABINET_PATH } from "@/lib/navigation/flowExit";
import { PersonalCabinetChip } from "@/components/navigation/PersonalCabinetChip";

/** Верхняя полоса кабинета: бренд слева, аккаунт справа. */
export function CabinetTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border/80 bg-background/95 px-4 backdrop-blur-md md:px-6">
      <Link
        to={CABINET_PATH}
        className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <span className="truncate font-display hidden sm:inline">Мастерская</span>
      </Link>
      <PersonalCabinetChip />
    </header>
  );
}
