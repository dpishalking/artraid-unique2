import {
  ArrowRight,
  Compass,
  HelpCircle,
  Handshake,
  Layers,
  Lightbulb,
  Rocket,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { IDEA_LAB_IDEA_LIMIT_USER } from "@/lib/ideaLab/ideaQuota";
import { IDEA_LAB_MESSAGE_LIMIT } from "@/lib/ideaLab/constants";
import {
  IDEA_LAB_REGISTER_FAQ_KICKER,
  IDEA_LAB_REGISTER_FAQ_TITLE,
  IDEA_LAB_REGISTER_SITUATIONS,
  IDEA_LAB_REGISTER_SITUATIONS_LEAD,
  IDEA_LAB_REGISTER_SITUATIONS_TITLE,
  ideaLabRegisterFaq,
  type IdeaLabRegisterSituationIcon,
} from "@/lib/ideaLab/serviceGuide";
import { il } from "@/lib/ideaLab/uiClasses";
import { cn } from "@/lib/utils";

type Props = {
  onStart: () => void;
};

const SITUATION_ICONS: Record<IdeaLabRegisterSituationIcon, LucideIcon> = {
  spark: Lightbulb,
  compass: Compass,
  rocket: Rocket,
  handshake: Handshake,
  layers: Layers,
  growth: TrendingUp,
};

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/[0.06] px-3 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_2px_hsl(43_90%_55%/0.6)]" />
      <span className={il.label}>{children}</span>
    </span>
  );
}

/** Второй экран лендинга регистрации: ситуации и FAQ. */
export function IdeaLabRegisterBelowFold({ onStart }: Props) {
  const faq = ideaLabRegisterFaq(IDEA_LAB_MESSAGE_LIMIT, IDEA_LAB_IDEA_LIMIT_USER);

  return (
    <div className="relative mt-10 sm:mt-12">
      <div className={cn("pointer-events-none absolute inset-x-0 -top-px h-px", il.divider)} />

      {/* ── Ситуации ── */}
      <section className="pt-8 sm:pt-10" aria-labelledby="idea-lab-situations-title">
        <div className="flex flex-col items-center text-center">
          <h2
            id="idea-lab-situations-title"
            className="max-w-3xl font-display text-[1.55rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-3xl"
          >
            Тот самый момент, когда пора в{" "}
            <span className={il.goldText}>Idea Lab</span>
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {IDEA_LAB_REGISTER_SITUATIONS_LEAD}
          </p>
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {IDEA_LAB_REGISTER_SITUATIONS.map((item) => {
            const Icon = SITUATION_ICONS[item.icon] ?? Sparkles;
            return (
              <li
                key={item.title}
                className={cn("group relative flex h-full flex-col p-4 sm:p-5", il.card)}
              >
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.18] to-amber-500/[0.04] text-amber-300 shadow-[0_0_20px_-6px_hsl(43_90%_55%/0.5)] transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <h3 className="relative z-10 mt-3 text-sm font-semibold leading-snug text-foreground sm:text-base">
                  {item.title}
                </h3>
                <p className="relative z-10 mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── FAQ ── */}
      <section className="mt-10 sm:mt-12" aria-labelledby="idea-lab-faq-title">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <SectionKicker>{IDEA_LAB_REGISTER_FAQ_KICKER}</SectionKicker>
            <h2
              id="idea-lab-faq-title"
              className="mt-3 font-display text-[1.55rem] font-bold leading-[1.15] tracking-tight text-foreground sm:text-3xl"
            >
              {IDEA_LAB_REGISTER_FAQ_TITLE}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              Никакого мелкого шрифта и скрытых условий. Если остался вопрос — самый честный ответ
              даст сам диалог.
            </p>

            <div className={cn("mt-5 flex flex-col gap-3 p-4 sm:p-5", il.glass)}>
              <p className="text-sm font-semibold text-foreground">Готовы попробовать?</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Регистрация займёт меньше минуты — и вы сразу в диалоге с наставником.
              </p>
              <Button
                type="button"
                className={cn("mt-1 h-11 w-full px-6 sm:w-auto", il.btnPrimary)}
                onClick={onStart}
              >
                Создать аккаунт и начать
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className={cn("overflow-hidden p-2 sm:p-3", il.glass)}>
            <Accordion type="single" collapsible className="w-full">
              {faq.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`faq-${index}`}
                  className="border-amber-500/10 px-3 last:border-b-0 sm:px-4"
                >
                  <AccordionTrigger className="group gap-3 py-3 text-left text-sm font-medium text-foreground hover:no-underline data-[state=open]:text-amber-200 sm:text-[15px] [&>svg]:text-amber-400/70">
                    <span className="flex items-start gap-3">
                      <HelpCircle
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/50 transition-colors group-hover:text-amber-400 group-data-[state=open]:text-amber-400"
                        strokeWidth={1.75}
                      />
                      {item.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 pl-7 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>
    </div>
  );
}