import { Lock } from "lucide-react";
import { IDEA_LAB_IDEA_LIMIT_USER } from "@/lib/ideaLab/ideaQuota";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  compact?: boolean;
};

/** Блок «ещё одну идею нельзя» для пользователей без админ-доступа. */
export function IdeaLabMoreIdeasLocked({ className, compact }: Props) {
  return (
    <aside
      className={cn(
        il.glass,
        "relative overflow-hidden p-5 md:p-6",
        compact && "p-4",
        className,
      )}
      aria-label="Ограничение по числу идей"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />
      <div className="relative z-[1] flex flex-col items-center text-center sm:items-start sm:text-left">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-400/90">
          <Lock className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <p className={il.label}>Уровень доступа</p>
        <p className="mt-2 font-display text-lg font-semibold leading-snug text-foreground">
          Одна активная идея
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          На вашем уровне доступа можно вести{" "}
          <span className="font-medium text-foreground/90">
            {IDEA_LAB_IDEA_LIMIT_USER} идею
          </span>{" "}
          одновременно. Доработайте текущую в диалоге или в карточке прояснения — так вы
          получите максимум от Idea Lab.
        </p>
        {!compact && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground/80">
            Чтобы открывать несколько идей параллельно, нужен расширенный доступ. Сейчас у вас
            уже есть активная идея.
          </p>
        )}
      </div>
    </aside>
  );
}
