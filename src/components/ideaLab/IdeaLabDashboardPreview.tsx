import {
  BarChart3,
  FileText,
  Home,
  Layers,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { il } from "@/lib/ideaLab/uiClasses";

const SIDEBAR_ICONS = [Home, MessageSquare, FileText, Layers, BarChart3] as const;

const IDEA_SAMPLES = [
  { title: "Онлайн-курс", progress: 84 },
  { title: "Сервис автоматизации", progress: 62 },
  { title: "Мобильное приложение", progress: 41 },
] as const;

const ACTIVITY = [
  "Идея обновлена · 2 мин",
  "Добавлен сегмент",
  "Сформулировано обещание",
] as const;

/** Декоративное превью дашборда для первого экрана лендинга. */
export function IdeaLabDashboardPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center px-4 py-6 lg:px-6 lg:py-8 xl:px-8",
        className,
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_60%_45%,hsl(43_90%_50%/0.14),transparent_70%)]" />

      <div className="relative w-full max-w-[min(100%,32rem)] [perspective:1200px]">
        <div
          className={cn(
            "overflow-hidden rounded-[1.25rem] lg:rotate-[1.5deg]",
            "border border-amber-500/20 bg-[hsl(220_26%_7%/0.78)]",
            "shadow-[0_28px_70px_-30px_hsl(0_0%_0%/0.9),0_0_50px_-18px_hsl(43_90%_50%/0.28)]",
            "backdrop-blur-xl",
          )}
        >
          <div className="flex min-h-[19rem] lg:min-h-[22rem]">
            <div className="flex w-10 shrink-0 flex-col items-center gap-2.5 border-r border-amber-500/10 bg-[hsl(220_28%_5%/0.55)] py-3">
              {SIDEBAR_ICONS.map((Icon, i) => (
                <span
                  key={Icon.name}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md",
                    i === 0 ? "bg-amber-500/15 text-amber-400" : "text-muted-foreground/60",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              ))}
            </div>

            <div className="min-w-0 flex-1 p-3.5 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Мой Idea Lab</p>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-amber-300">
                  Live
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className={cn("p-2.5", il.previewCard)}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-foreground">Ясность идеи</p>
                    <span className="text-xs font-bold text-amber-400">84%</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted/40">
                    <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-amber-600 to-amber-400" />
                  </div>
                </div>

                <div className={cn("p-2.5", il.previewCard)}>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Следующий шаг
                  </p>
                  <p className="mt-1 text-[11px] font-medium leading-snug text-foreground">
                    Сформулировать суть продукта
                  </p>
                </div>
              </div>

              <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Мои идеи
              </p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {IDEA_SAMPLES.map((idea) => (
                  <div key={idea.title} className={cn("p-2", il.previewCard)}>
                    <p className="truncate text-[10px] font-medium text-foreground">{idea.title}</p>
                    <div className="mt-1.5 h-0.5 overflow-hidden rounded-full bg-muted/35">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-600/90 to-amber-400/90"
                        style={{ width: `${idea.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className={cn("mt-2.5 p-2.5", il.previewCard)}>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  <p className="text-[10px] font-medium text-foreground">Диалог с наставником</p>
                </div>
                <div className="mt-1.5 rounded-md bg-muted/20 px-2 py-1.5 text-[10px] leading-snug text-muted-foreground">
                  Кому вы хотите продавать в первую очередь?
                </div>
              </div>
            </div>

            <div className="hidden w-[6.5rem] shrink-0 border-l border-amber-500/10 bg-[hsl(220_28%_5%/0.35)] p-2.5 xl:block">
              <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                Активность
              </p>
              <ul className="mt-2 space-y-2">
                {ACTIVITY.map((line) => (
                  <li key={line} className="text-[9px] leading-snug text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
