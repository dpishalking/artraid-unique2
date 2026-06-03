import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onStart: () => void;
  onSkip: () => void;
};

export function OnboardingWelcomeStep({ onStart, onSkip }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <motion.div className="rounded-2xl border border-primary/20 bg-card/80 p-6 md:p-8 shadow-card">
        <p className="text-sm font-medium text-primary mb-3">Добро пожаловать</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight leading-snug">
          Мы уже собрали первые данные о вашем проекте
        </h1>
        <p className="mt-4 text-muted-foreground text-base leading-relaxed">
          Сейчас поможем быстро превратить их в рабочие маркетинговые материалы: оффер, анализ
          сайта, прототип лендинга и идеи для усиления продаж.
        </p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="h-12 flex-1 bg-gradient-money text-primary-foreground font-semibold shadow-glow"
          onClick={onStart}
        >
          Начать настройку проекта
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        <Button size="lg" variant="ghost" className="text-muted-foreground" onClick={onSkip}>
          Пропустить
        </Button>
      </div>
    </motion.div>
  );
}
