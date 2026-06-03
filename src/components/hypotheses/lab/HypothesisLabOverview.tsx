import { Link } from "react-router-dom";
import { ArrowRight, Check, FlaskConical, Plus, ScanSearch, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHypothesisLab } from "@/components/hypotheses/HypothesisLabProvider";
import { SectionHeader } from "@/components/hypotheses/lab/shared";
import { hypothesisLabBase } from "@/lib/hypotheses/labNav";
import { growthCycleHref } from "@/lib/growthCycle/routes";
import { toolHref } from "@/lib/navigation/productNav";

const STEPS = [
  { n: 1, title: "Сформулируйте", desc: "Опишите проблему — AI предложит гипотезы" },
  { n: 2, title: "Запустите тест", desc: "Внедрите изменение и соберите данные" },
  { n: 3, title: "Примите решение", desc: "Scale / Pivot / Stop + инсайт" },
] as const;

export function HypothesisLabOverview() {
  const ctx = useHypothesisLab();
  const base = hypothesisLabBase(ctx.projectId);
  const auditHref = toolHref("/audit", ctx.projectId);

  const currentStep =
    ctx.running.length > 0
      ? 2
      : ctx.knowledge.length > 0
        ? 3
        : ctx.candidates.length > 0 || ctx.hasAudit
          ? 1
          : 1;

  const nextAction = (() => {
    if (ctx.running.some((h) => h.status === "in_progress")) {
      return {
        label: "Зафиксировать результат теста",
        href: `${base}/tests`,
        hint: `${ctx.running.length} гипотез${ctx.running.length === 1 ? "а" : "ы"} в работе`,
      };
    }
    if (ctx.candidates.length > 0) {
      return {
        label: "Настроить протокол для бэклога",
        href: `${base}/backlog`,
        hint: `${ctx.candidates.length} гипотез${ctx.candidates.length === 1 ? "а" : "ы"} ждут запуска`,
      };
    }
    return {
      label: "Сгенерировать первую гипотезу",
      href: `${base}/generate`,
      hint: "Опишите проблему — AI предложит варианты тестов",
    };
  })();

  const stats = [
    { label: "Бэклог", count: ctx.candidates.length, href: `${base}/backlog` },
    { label: "В тесте", count: ctx.running.length, href: `${base}/tests` },
    { label: "Итоги", count: ctx.knowledge.length, href: `${base}/results` },
  ];

  const isEmpty =
    ctx.candidates.length === 0 && ctx.running.length === 0 && ctx.knowledge.length === 0;

  return (
    <div>
      <SectionHeader
        title="Обзор лаборатории"
        description="Один экран — статус, следующий шаг и быстрые переходы."
      />

      {ctx.hasAudit && (
        <div className="rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/[0.08] to-money/[0.04] p-5 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Wand2 className="h-4 w-4 shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Цикл внедрения</p>
              </div>
              <p className="font-display text-base font-semibold text-foreground">
                10 гипотез из аудита → канбан → результат
              </p>
              <p className="mt-1 text-sm text-muted-foreground max-w-lg">
                Отдельный контур: берёте гипотезы из разбора сайта, внедряете и фиксируете итог — без смешивания с обзором проекта.
              </p>
            </div>
            <Button asChild className="shrink-0 bg-gradient-money text-primary-foreground">
              <Link to={growthCycleHref(ctx.projectId)}>
                Открыть цикл
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-3 mb-8">
        {STEPS.map((step) => (
          <div
            key={step.n}
            className={cn(
              "rounded-xl border px-3 py-2.5",
              currentStep === step.n
                ? "border-primary/50 bg-primary/10"
                : currentStep > step.n
                  ? "border-money/30 bg-money/5"
                  : "border-border/60 bg-card/40",
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  currentStep === step.n
                    ? "bg-primary text-primary-foreground"
                    : currentStep > step.n
                      ? "bg-money/20 text-money"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {currentStep > step.n ? <Check className="h-3 w-3" /> : step.n}
              </span>
              <p className="text-xs font-semibold">{step.title}</p>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 pl-7">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-primary/30 bg-primary/[0.06] p-5 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary mb-1">
          Следующий шаг
        </p>
        <p className="text-sm text-muted-foreground mb-3">{nextAction.hint}</p>
        <Button asChild className="bg-gradient-money text-primary-foreground">
          <Link to={nextAction.href}>
            {nextAction.label}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.href}
            className="rounded-xl border border-border bg-card/50 px-4 py-3 hover:border-primary/40 transition-colors"
          >
            <p className="text-2xl font-display font-bold tabular-nums">{s.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/30 p-8 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold">Лаборатория пуста</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Начните с описания проблемы — AI сгенерирует гипотезы. Аудит сайта тоже подскажет идеи.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild className="bg-gradient-money text-primary-foreground">
              <Link to={`${base}/generate`}>
                <Sparkles className="mr-2 h-4 w-4" />
                Новая гипотеза
              </Link>
            </Button>
            {!ctx.hasAudit && (
              <Button variant="outline" asChild>
                <Link to={auditHref}>
                  <ScanSearch className="mr-2 h-4 w-4" />
                  Аудит сайта
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {!isEmpty && (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`${base}/generate`}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Добавить гипотезу
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
