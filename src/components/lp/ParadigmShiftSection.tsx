import { cn } from "@/lib/utils";

export type ParadigmShiftBlock = {
  headline: string;
  old_belief: string;
  new_belief: string;
  bridge?: string;
  transition_hook?: string;
};

/** Человекочитаемые подписи вместо «старое/новое убеждение». */
export const PARADIGM_SHIFT_LABELS = {
  myth: "Распространённый миф",
  truth: "Как на самом деле",
  why: "Почему миф не работает",
} as const;

type Props = {
  block: ParadigmShiftBlock;
  variant?: "full" | "clip";
  className?: string;
};

/**
 * Секция «разоблачение мифа»: миф → правда → объяснение.
 * Поля JSON old_belief / new_belief / bridge — для совместимости с генерацией.
 */
export function ParadigmShiftSection({ block, variant = "full", className }: Props) {
  const isClip = variant === "clip";

  return (
    <div className={cn("space-y-4", className)}>
      <h2
        className={cn(
          "font-bold leading-snug",
          isClip ? "text-base md:text-lg text-white" : "font-display text-2xl md:text-3xl",
        )}
      >
        {block.headline}
      </h2>

      <div className={cn("space-y-3", !isClip && "md:space-y-0 md:grid md:grid-cols-2 md:gap-4")}>
        <div
          className={cn(
            "rounded-xl border px-4 py-4",
            isClip
              ? "bg-white/5 border-white/10"
              : "border-destructive/25 bg-destructive/[0.04]",
          )}
        >
          <div
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider mb-2",
              isClip ? "text-[#e85c5c]" : "text-destructive/80",
            )}
          >
            {PARADIGM_SHIFT_LABELS.myth}
          </div>
          <p
            className={cn(
              "text-sm leading-relaxed",
              isClip ? "text-white/90 italic" : "text-foreground/85 italic",
            )}
          >
            {quoteWrap(block.old_belief)}
          </p>
        </div>

        <div
          className={cn(
            "rounded-xl border px-4 py-4",
            isClip
              ? "bg-white/5 border-[#e8c547]/40"
              : "border-primary/35 bg-primary/[0.06]",
          )}
        >
          <div
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider mb-2",
              isClip ? "text-[#e8c547]" : "text-primary",
            )}
          >
            {PARADIGM_SHIFT_LABELS.truth}
          </div>
          <p
            className={cn(
              "text-sm leading-relaxed font-medium",
              isClip ? "text-white" : "text-foreground",
            )}
          >
            {block.new_belief}
          </p>
        </div>
      </div>

      {block.bridge?.trim() && (
        <div className={cn(isClip ? "text-sm text-white/80 leading-relaxed" : "")}>
          {!isClip && (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {PARADIGM_SHIFT_LABELS.why}
            </p>
          )}
          <p className={isClip ? undefined : "text-muted-foreground leading-relaxed"}>{block.bridge}</p>
        </div>
      )}
    </div>
  );
}

function quoteWrap(text: string): string {
  const t = text.trim();
  if (t.startsWith("«") || t.startsWith('"') || t.startsWith("'")) return t;
  return `«${t}»`;
}
