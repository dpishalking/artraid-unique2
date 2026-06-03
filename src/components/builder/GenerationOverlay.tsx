import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles } from "lucide-react";

const STAGES = [
  { id: "brief", label: "Анализ брифа", desc: "Считываем сценарий и ваши ответы" },
  { id: "structure", label: "Структура страницы", desc: "Собираем блоки лендинга" },
  { id: "copy", label: "Тексты блоков", desc: "Пишем заголовки и смыслы под ЦА" },
  { id: "final", label: "Финальная сборка", desc: "Склеиваем прототип" },
] as const;

type Props = {
  open: boolean;
  scenarioTitle: string;
  blockCount: number;
};

export function GenerationOverlay({ open, scenarioTitle, blockCount }: Props) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setStageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStageIndex((i) => (i < STAGES.length - 1 ? i + 1 : i));
    }, 9000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" />
          <motion.div
            className="pointer-events-none absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 4, repeat: Infinity }}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="relative w-full max-w-lg rounded-3xl border border-primary/25 bg-card/90 p-8 shadow-glow backdrop-blur-md"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-money shadow-glow">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold tracking-tight">Собираем прототип</h2>
                <p className="text-sm text-muted-foreground">
                  {scenarioTitle} · {blockCount} блоков
                </p>
              </div>
            </div>

            <ul className="space-y-3">
              {STAGES.map((stage, i) => {
                const done = i < stageIndex;
                const active = i === stageIndex;
                return (
                  <motion.li
                    key={stage.id}
                    layout
                    className={`flex gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      active
                        ? "border-primary/40 bg-primary/10"
                        : done
                          ? "border-money/25 bg-money/5"
                          : "border-border/60 bg-background/30 opacity-60"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        done
                          ? "bg-money/20 text-money"
                          : active
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? (
                        <Check className="h-4 w-4" />
                      ) : active ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </span>
                    <div>
                      <p className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                        {stage.label}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stage.desc}</p>
                    </div>
                  </motion.li>
                );
              })}
            </ul>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Обычно 30–60 секунд. Не закрывайте вкладку.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
