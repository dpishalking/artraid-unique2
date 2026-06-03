import { Link, Outlet, useLocation } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BookOpen,
  FlaskConical,
  LayoutDashboard,
  ListTodo,
  Loader2,
  Play,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HYPOTHESIS_LAB_NAV,
  projectOverviewHref,
  resolveHypothesisLabSection,
} from "@/lib/hypotheses/labNav";
import { useHypothesisLab } from "@/components/hypotheses/HypothesisLabProvider";

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  generate: Sparkles,
  backlog: ListTodo,
  tests: Play,
  results: BookOpen,
};

function countForSection(
  id: string,
  ctx: ReturnType<typeof useHypothesisLab>,
): number | null {
  if (id === "backlog") return ctx.candidates.length || null;
  if (id === "tests") return ctx.running.length || null;
  if (id === "results") return ctx.knowledge.length || null;
  return null;
}

export function HypothesisLabShell() {
  const { pathname } = useLocation();
  const ctx = useHypothesisLab();
  const section = resolveHypothesisLabSection(pathname, ctx.projectId);
  const activeItem = HYPOTHESIS_LAB_NAV.find((i) => i.id === section);

  if (ctx.loading) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Загружаем лабораторию…
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col lg:flex-row">
      <aside className="shrink-0 border-b border-border/70 bg-card/60 backdrop-blur-sm lg:w-60 lg:border-b-0 lg:border-r xl:w-64 lg:sticky lg:top-12 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className="space-y-4 p-4 lg:p-5">
          <div className="space-y-3">
            <Link
              to={projectOverviewHref(ctx.projectId)}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              К проекту
            </Link>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <FlaskConical className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold leading-tight">
                  Лаборатория гипотез
                </p>
                {ctx.projectName && (
                  <p className="truncate text-[11px] text-muted-foreground mt-0.5" title={ctx.projectName}>
                    {ctx.projectName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto pb-0.5 lg:flex-col lg:overflow-visible lg:space-y-0.5">
            {HYPOTHESIS_LAB_NAV.map((item) => {
              const Icon = ICONS[item.icon] ?? FlaskConical;
              const active = section === item.id;
              const count = countForSection(item.id, ctx);
              return (
                <Link
                  key={item.id}
                  to={item.href(ctx.projectId)}
                  className={cn(
                    "flex min-w-[148px] items-start gap-2.5 rounded-xl px-3 py-2.5 transition-colors lg:min-w-0",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium leading-none">
                      {item.label}
                      {count != null && count > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none",
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-muted text-foreground",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "mt-1 hidden text-[11px] leading-snug lg:block",
                        active ? "text-primary-foreground/80" : "text-muted-foreground",
                      )}
                    >
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        {activeItem && (
          <div className="border-b border-border/50 px-4 py-3 lg:hidden">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {activeItem.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{activeItem.description}</p>
          </div>
        )}
        <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
