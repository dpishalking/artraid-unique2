import { motion } from "framer-motion";
import { ArrowRight, MessageSquare } from "lucide-react";
import authorPhoto from "@/assets/author.png";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { REPORT_CARD } from "./reportDesign";

type Props = {
  finalCta: string;
  hostname?: string;
};

/** Финальный аккорд: лицо автора + одна кнопка. Эмоциональное завершение, не корпоративный CTA. */
export function FinalCta({ finalCta, hostname }: Props) {
  return (
    <motion.div
      id="sec-cta"
      data-pdf-hide
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
      className={cn(REPORT_CARD, "relative overflow-hidden border-money/30 bg-gradient-to-br from-money/[0.06] via-card/40 to-background p-6 md:p-10")}
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-money/15 blur-3xl" />
      <div className="relative grid items-center gap-6 md:grid-cols-[160px_1fr] md:gap-10">
        <div className="mx-auto md:mx-0">
          <div className="relative">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-money opacity-25 blur-lg" />
            <img
              src={authorPhoto}
              alt="Даниил Пищалкин"
              className="relative h-32 w-32 rounded-2xl object-cover md:h-40 md:w-40"
              loading="lazy"
            />
          </div>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-money">Даниил Пищалкин · автор разбора</p>
          <h3 className="mt-2 font-display text-xl font-semibold leading-tight text-foreground sm:text-2xl">
            {finalCta || `Разберём ${hostname ?? "ваш сайт"} руками за 60 минут`}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-foreground/85 sm:text-base">
            AI показывает картину сверху. На созвоне разберу руками — с готовыми текстами,
            структурой и приоритетами. Без презентаций и продаж.
          </p>
          <div className="mt-6 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
            <Button
              asChild
              className="group h-12 rounded-xl bg-gradient-money px-6 font-semibold text-primary-foreground"
            >
              <a href="https://t.me/d_pishalking" target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-2 h-4 w-4" />
                Разобрать руками за 60 минут
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
            <span className="text-xs text-muted-foreground">обычно отвечаю в течение часа</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
