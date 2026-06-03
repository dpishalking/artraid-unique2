import {
  ArrowRight,
  Layers,
  MessageSquare,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { IdeaLabPasswordAuthForm } from "@/components/ideaLab/IdeaLabPasswordAuthForm";
import {
  IDEA_LAB_OFFER_FEATURES,
  IDEA_LAB_OFFER_HEADLINE,
  IDEA_LAB_OFFER_LEAD,
  IDEA_LAB_OFFER_TRUST,
} from "@/lib/ideaLab/serviceGuide";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";

const FEATURE_ICONS = [MessageSquare, Users, Layers, Sparkles] as const;

type Props = {
  redirectNext: string;
  onStart: () => void;
};

/** Две колонки с общими строками grid — оффер-блок и форма на одном уровне. */
export function IdeaLabRegisterSplit({ redirectNext, onStart }: Props) {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_auto_auto] lg:items-start lg:gap-x-10 lg:gap-y-0 xl:gap-x-12">
      <p
        className={cn(
          il.label,
          "order-3 min-h-4 border-t border-amber-500/10 pt-6 lg:order-none lg:col-start-2 lg:row-start-1 lg:border-t-0 lg:pt-0",
        )}
      >
        Шаг 1 · аккаунт
      </p>

      <h1
        className={cn(
          "order-1 max-w-xl font-display text-[1.65rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-3xl lg:order-none lg:col-start-1 lg:row-start-2 lg:mt-2 lg:text-[2.1rem] xl:text-[2.35rem]",
        )}
      >
        {IDEA_LAB_OFFER_HEADLINE}
      </h1>

      <h2
        className={cn(
          "order-4 mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:hidden",
        )}
      >
        Откройте Idea Lab за минуту
      </h2>

      <section className="order-2 flex min-h-0 flex-col lg:order-none lg:col-start-1 lg:row-start-3 lg:mt-3">
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
          {IDEA_LAB_OFFER_LEAD}
        </p>

        <ul className="mt-4 grid auto-rows-fr max-w-xl gap-2.5 sm:grid-cols-2">
          {IDEA_LAB_OFFER_FEATURES.map((feature, index) => {
            const Icon = FEATURE_ICONS[index] ?? Sparkles;
            return (
              <li
                key={feature}
                className="flex h-full min-h-[4rem] items-center gap-2.5 rounded-lg border border-amber-500/15 bg-card/85 px-3 py-2 dark:border-amber-500/10 dark:bg-amber-500/[0.035]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-amber-500/25 bg-amber-500/10 text-amber-700 dark:bg-amber-500/[0.06] dark:text-amber-400">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <span className="text-[11px] leading-snug text-foreground/90 sm:text-xs">{feature}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 lg:hidden">
          <Button type="button" className={cn("h-11 px-6", il.btnPrimary)} onClick={onStart}>
            Войти и начать
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <p className="mt-4 inline-flex max-w-lg items-start gap-2 text-[11px] leading-relaxed text-muted-foreground sm:text-xs lg:mt-5">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/80" aria-hidden />
          {IDEA_LAB_OFFER_TRUST}
        </p>
      </section>

      <aside
        id="signup"
        className={cn(
          "order-5 scroll-mt-16 flex min-h-0 flex-col lg:order-none lg:col-start-2 lg:row-start-2 lg:row-span-2 lg:mt-2 lg:border-l lg:border-amber-500/10 lg:pl-10 xl:pl-12",
        )}
      >
        <h2 className="mb-2 hidden font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:block">
          Откройте Idea Lab за минуту
        </h2>
        <div className={cn("flex flex-col p-3.5 sm:p-4", il.glass)}>
          <IdeaLabPasswordAuthForm
            redirectNext={redirectNext}
            defaultMode="signup"
          />
        </div>
      </aside>
    </div>
  );
}
