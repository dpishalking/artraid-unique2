import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Star, Loader2, ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSpeechInput } from "@/hooks/useSpeechInput";

type Props = {
  stepNumber: number;
  totalSteps: number;
  label: string;
  question: string;
  hint?: string;
  hintExtra?: string;
  placeholder: string;
  examples: { niche: string; text: string }[];
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack?: () => void;
  multiline?: boolean;
  required?: boolean;
  nextLabel?: string;
  userNiche?: string;
  aiHint?: string[];
  aiHintLoading?: boolean;
  aiHintError?: boolean;
  onRetryHints?: () => void;
};

const NICHE_KEYWORDS: { keywords: string[]; targetNiche: string }[] = [
  { keywords: ["b2b", "saas", "crm", "erp", "software", "платформ", "сервис для бизнес", "автоматизац"], targetNiche: "B2B SaaS" },
  { keywords: ["школ", "обучен", "курс", "edtech", "образован", "наставник", "тренинг", "коуч", "менторств"], targetNiche: "Инфопродукт" },
  { keywords: ["эпиляц", "beauty", "красот", "косметик", "салон", "маникюр", "визаж", "студи", "спа", "массаж", "уход за"], targetNiche: "Услуга" },
  { keywords: ["магазин", "товар", "интернет-магаз", "корм", "одежд", "мебель", "электроник"], targetNiche: "Физтовар" },
  { keywords: ["медицин", "клиник", "врач", "здоровь", "лечен", "стоматолог", "психолог", "терапевт"], targetNiche: "Услуга" },
  { keywords: ["ремонт", "строительств", "отделк", "дизайн интерьер", "монтаж"], targetNiche: "Услуга" },
  { keywords: ["консалтинг", "консультац", "аудит", "юрид", "бухгалтер", "финанс", "маркетинг агентств"], targetNiche: "B2B SaaS" },
  { keywords: ["фитнес", "спорт", "тренер", "похудени", "питани"], targetNiche: "Услуга" },
  { keywords: ["агентств", "недвижим", "риелтор", "аренд", "ипотек"], targetNiche: "Услуга" },
];

function findBestMatch(niche: string, examples: { niche: string; text: string }[]): number {
  if (!niche.trim()) return -1;
  const lower = niche.toLowerCase();

  for (const rule of NICHE_KEYWORDS) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const idx = examples.findIndex((ex) => ex.niche === rule.targetNiche);
      if (idx !== -1) return idx;
    }
  }
  return -1;
}

export function StepCard(p: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const speech = useSpeechInput((t) => p.onChange(t));
  const [extraOpen, setExtraOpen] = useState(false);

  useEffect(() => { ref.current?.focus(); }, []);

  const canNext = p.required ? p.value.trim().length >= 2 : true;

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canNext) p.onNext();
  };

  const bestIdx = p.userNiche && !p.aiHint?.length ? findBestMatch(p.userNiche, p.examples) : -1;
  const sortedExamples = bestIdx >= 0
    ? [p.examples[bestIdx], ...p.examples.filter((_, i) => i !== bestIdx)]
    : p.examples;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5">{p.label}</span>
        <span>Шаг {p.stepNumber} из {p.totalSteps}</span>
      </div>

      <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
        {p.question}
      </h2>
      {p.hint && <p className="mt-3 text-base text-muted-foreground">{p.hint}</p>}

      {p.hintExtra && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExtraOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary/70 hover:text-primary transition"
          >
            <span>Как это работает — пример из практики</span>
            <motion.span animate={{ rotate: extraOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronDown className="h-3.5 w-3.5" />
            </motion.span>
          </button>
          <AnimatePresence>
            {extraOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed rounded-xl border border-border bg-card/60 px-4 py-3">
                  {p.hintExtra}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {speech.supported && !speech.listening && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground">
          <Mic className="h-3 w-3 text-primary shrink-0" />
          Можно наговорить голосом — нажмите <span className="font-semibold text-foreground">кнопку микрофона</span> справа
        </div>
      )}

      <div className="mt-3 relative">
        <Textarea
          ref={ref}
          value={p.value}
          onChange={(e) => p.onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={p.placeholder}
          rows={p.multiline ? 4 : 2}
          maxLength={500}
          className="min-h-[110px] resize-none rounded-2xl border-2 border-border bg-card p-5 pr-16 text-lg leading-relaxed shadow-card focus-visible:border-primary focus-visible:ring-0 transition-colors placeholder:text-sm placeholder:italic placeholder:text-muted-foreground/45 placeholder:leading-relaxed"
        />
        {speech.supported && (
          <button
            type="button"
            onClick={speech.toggle}
            aria-label={speech.listening ? "Остановить запись" : "Наговорить голосом"}
            className={`absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
              speech.listening
                ? "border-destructive bg-destructive/10 text-destructive animate-pulse"
                : "border-border bg-background text-muted-foreground hover:text-primary hover:border-primary"
            }`}
          >
            {speech.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
        )}
        {speech.listening && (
          <div className="absolute -bottom-7 left-2 text-xs text-destructive font-medium flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
            Слушаю… говорите
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        {p.onBack ? (
          <Button type="button" variant="ghost" onClick={p.onBack}>← Назад</Button>
        ) : <span />}
        <Button
          type="button"
          onClick={p.onNext}
          disabled={!canNext}
          className="h-12 px-8 bg-gradient-money text-primary-foreground font-semibold shadow-glow disabled:opacity-40 disabled:shadow-none"
        >
          {p.nextLabel || "Дальше →"}
        </Button>
      </div>
      <div className="mt-2 text-right text-[11px] text-muted-foreground">
        ⌘/Ctrl + Enter — дальше
      </div>

      {(p.aiHintLoading || (p.aiHint && p.aiHint.length > 0) || p.aiHintError) && (
        <div className="mt-10">
          <AnimatePresence mode="wait">
            {p.aiHintLoading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground"
              >
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin flex-shrink-0" />
                AI подбирает примеры под ваш контекст…
              </motion.div>
            )}
            {p.aiHint && p.aiHint.length > 0 && !p.aiHintLoading && !p.aiHintError && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Star className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">AI · Для вашей ниши</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {p.aiHint.map((hint, i) => {
                    const short = hint.length > 100 ? hint.slice(0, 97).trimEnd() + "…" : hint;
                    return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        type="button"
                        onClick={() => p.onChange(hint)}
                        title={hint}
                        className="text-left rounded-xl border-2 border-primary/40 bg-primary/5 px-4 py-3 hover:border-primary hover:bg-primary/10 transition group"
                      >
                        <div className="text-sm text-foreground leading-snug">{short}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
            {p.aiHintError && !p.aiHintLoading && (
              <motion.div
                key="hint-error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
              >
                <p className="text-muted-foreground mb-2">Не удалось загрузить AI-примеры.</p>
                {p.onRetryHints && (
                  <Button type="button" variant="outline" size="sm" onClick={p.onRetryHints}>
                    Повторить
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

    </motion.div>
  );
}
