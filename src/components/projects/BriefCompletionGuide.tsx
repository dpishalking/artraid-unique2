import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  FlaskConical,
  Globe,
  LayoutTemplate,
  Megaphone,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toolHref } from "@/lib/navigation/productNav";

type Step = {
  icon: typeof Brain;
  title: string;
  description: string;
  href: string;
  cta: string;
};

type Props = {
  projectId: string;
  hasWebsite: boolean;
  variant?: "page" | "sheet";
  onContinue: (nextPath?: string) => void;
};

export function BriefCompletionGuide({
  projectId,
  hasWebsite,
  variant = "page",
  onContinue,
}: Props) {
  const overviewHref = `/projects/${projectId}`;

  const steps: Step[] = [
    {
      icon: Brain,
      title: "Память проекта — ваш контекст для AI",
      description:
        "Ответы из брифа уже сохранены. Система будет опираться на них в офферах, аудитах и прототипах. При желании дополните память с сайта или из файлов.",
      href: `/projects/${projectId}/memory`,
      cta: "Открыть память",
    },
    {
      icon: Sparkles,
      title: "Обзор проекта",
      description:
        "На главной странице проекта — маркетинговая карта, прогресс памяти и подсказка «следующий шаг». Начните отсюда, если не знаете, куда нажать.",
      href: overviewHref,
      cta: "Перейти в обзор",
    },
    hasWebsite
      ? {
          icon: ScanSearch,
          title: "Аудит сайта",
          description:
            "AI разберёт упаковку лендинга: сильные и слабые места, гипотезы для роста конверсии. Результаты попадут в проект автоматически.",
          href: toolHref("/audit", projectId),
          cta: "Запустить аудит",
        }
      : {
          icon: Globe,
          title: "Добавьте сайт",
          description:
            "Укажите URL лендинга в контексте проекта — тогда станет доступен аудит и сравнение с конкурентами.",
          href: `/projects/${projectId}/context`,
          cta: "Добавить сайт",
        },
    {
      icon: Megaphone,
      title: "Генератор оффера",
      description:
        "На основе памяти проекта AI предложит формулировки обещания, выгод и CTA — можно сразу взять в работу.",
      href: toolHref("/offer-generator", projectId, { pick: "vectors" }),
      cta: "Собрать оффер",
    },
    {
      icon: LayoutTemplate,
      title: "Прототип лендинга",
      description:
        "Получите структуру и тексты лендинга под ваш продукт — не с нуля, а из уже заполненного контекста.",
      href: toolHref("/prototype", projectId),
      cta: "Создать прототип",
    },
    {
      icon: FlaskConical,
      title: "Лаборатория гипотез",
      description:
        "Фиксируйте идеи правок, тестируйте их и отмечайте результат — так маркетинг становится системным.",
      href: `/projects/${projectId}/hypothesis-lab`,
      cta: "Открыть лабораторию",
    },
  ];

  const isSheet = variant === "sheet";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col",
        isSheet ? "py-2" : "bg-muted/10",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full flex-1 flex-col gap-6",
          isSheet ? "px-1" : "container max-w-3xl px-6 py-10",
        )}
      >
        <motion.div
          className="space-y-3 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/12 ring-1 ring-primary/25">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Бриф готов — проект создан</h2>
          <p className="text-sm leading-relaxed text-muted-foreground max-w-xl mx-auto">
            Вы заполнили базу о продукте. AI уже запомнил контекст — дальше инструменты работают в связке, без
            повторного ввода одного и того же.
          </p>
        </motion.div>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            Что вас ждёт дальше
          </p>
          <ol className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.05 }}
                  className="rounded-2xl border border-border/70 bg-card p-4 md:p-5"
                >
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <h3 className="font-semibold leading-snug">{step.title}</h3>
                      </div>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                      <Button
                        type="button"
                        variant="link"
                        className="h-auto p-0 text-primary"
                        asChild
                      >
                        <Link
                          to={step.href}
                          onClick={(e) => {
                            e.preventDefault();
                            onContinue(step.href);
                          }}
                        >
                          {step.cta}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>

        <motion.div
          className="sticky bottom-0 border-t border-border/50 bg-background/95 pt-4 pb-1 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        >
          <Button className="w-full" size="lg" onClick={() => onContinue(overviewHref)}>
            Перейти в обзор проекта
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            В любой момент все инструменты доступны в меню слева внутри проекта.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
