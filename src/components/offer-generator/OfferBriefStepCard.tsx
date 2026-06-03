import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { builderAiIsland, builderCardGlow, builderPremiumCard } from "@/components/builder/builderStyles";
import { cn } from "@/lib/utils";

type Props = {
  stepNumber: number;
  totalSteps: number;
  stepLabel: string;
  question: string;
  hint?: string;
  contextLine?: string | null;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  required?: boolean;
  nextLabel?: string;
  fieldError?: string | null;
  showValidation?: boolean;
  aiHint?: string[];
  aiHintLoading?: boolean;
  aiHintError?: boolean;
  aiHintErrorMessage?: string;
  onRetryHints?: () => void;
};

const SKELETON_COUNT = 4;

function HintSkeletons() {
  return (
    <motion.div
      key="skeletons"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-hidden
    >
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.4 }}
          animate={{ opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.12 }}
          className="h-[72px] w-[min(85vw,260px)] shrink-0 snap-start rounded-xl border border-primary/15 bg-primary/5"
        />
      ))}
    </motion.div>
  );
}

export function OfferBriefStepCard(p: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const speech = useSpeechInput((t) => p.onChange(t));
  const reduceMotion = useReducedMotion();
  const [flashInput, setFlashInput] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    ref.current?.focus();
    setTouched(false);
  }, [p.question]);

  const trimmed = p.value.trim();
  const canNext = p.required ? trimmed.length >= 2 : true;
  const showHintSection =
    p.aiHintLoading || (p.aiHint && p.aiHint.length > 0) || p.aiHintError;

  const showInlineHint =
    p.showValidation &&
    p.required &&
    touched &&
    trimmed.length > 0 &&
    trimmed.length < 2 &&
    !p.fieldError;

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canNext) p.onNext();
  };

  const applyHint = (hint: string) => {
    p.onChange(hint);
    setFlashInput(true);
    window.setTimeout(() => setFlashInput(false), 450);
    ref.current?.focus();
  };

  const motionProps = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -16 },
      };

  return (
    <motion.div {...motionProps} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }} className="w-full">
      <div className={cn(builderPremiumCard, "p-5 md:p-8 pb-6 md:pb-8")}>
        <div className={builderCardGlow} aria-hidden />

        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            Бриф · {p.stepLabel}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {p.stepNumber} / {p.totalSteps}
          </span>
        </div>

        <h2 className="font-display text-2xl font-bold leading-tight tracking-tight md:text-3xl">
          {p.question}
        </h2>
        {p.hint && <p className="mt-2 text-sm text-muted-foreground md:text-base">{p.hint}</p>}

        {p.contextLine && (
          <p className="mt-3 truncate text-sm text-muted-foreground/90" title={p.contextLine}>
            {p.contextLine}
          </p>
        )}

        <div className="relative mt-5">
          <Textarea
            ref={ref}
            value={p.value}
            onChange={(e) => {
              p.onChange(e.target.value);
              if (!touched) setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            onKeyDown={handleKey}
            placeholder={p.placeholder}
            rows={4}
            maxLength={500}
            aria-invalid={!!p.fieldError}
            aria-describedby={p.fieldError ? "field-error" : undefined}
            className={cn(
              "min-h-[120px] resize-none rounded-2xl border-2 bg-card/80 p-5 pr-14 text-base leading-relaxed shadow-sm transition-all duration-300 md:text-lg",
              "placeholder:text-sm placeholder:italic placeholder:text-muted-foreground/45",
              "focus-visible:ring-0",
              flashInput
                ? "border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]"
                : p.fieldError
                  ? "border-destructive/60 focus-visible:border-destructive"
                  : "border-border/80 focus-visible:border-primary/70",
            )}
          />
          {speech.supported && (
            <button
              type="button"
              onClick={speech.toggle}
              aria-label={speech.listening ? "Остановить запись" : "Наговорить голосом"}
              className={cn(
                "absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all",
                speech.listening
                  ? "border-destructive bg-destructive/10 text-destructive ring-2 ring-destructive/30"
                  : "border-border/80 bg-background/80 text-muted-foreground hover:border-primary/50 hover:text-primary",
              )}
            >
              {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
          {speech.listening && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
              Слушаю… говорите
            </p>
          )}
        </div>

        <div className="mt-2 flex min-h-[20px] items-center justify-between gap-2 text-xs">
          <AnimatePresence mode="wait">
            {p.fieldError ? (
              <motion.p
                key="err"
                id="field-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-destructive"
              >
                {p.fieldError}
              </motion.p>
            ) : showInlineHint ? (
              <motion.p key="min" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-muted-foreground">
                Ещё чуть-чуть — минимум 2 символа
              </motion.p>
            ) : (
              <span key="spacer" />
            )}
          </AnimatePresence>
          {p.required && (
            <span
              className={cn(
                "tabular-nums text-muted-foreground transition-colors",
                trimmed.length >= 2 && "text-primary/80",
              )}
            >
              {trimmed.length > 0 ? `${trimmed.length} симв.` : ""}
            </span>
          )}
        </div>

        {showHintSection && (
          <motion.div className={cn("mt-8", builderAiIsland)}>
            <div className="p-4">
              <AnimatePresence mode="wait">
                {p.aiHintLoading && <HintSkeletons />}
                {!p.aiHintLoading && p.aiHint && p.aiHint.length > 0 && (
                  <motion.div
                    key="hints"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-medium text-foreground">Примеры для вас</span>
                    </div>
                    <div
                      className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:overflow-visible md:pb-0"
                      role="list"
                    >
                      {p.aiHint.map((hint, i) => {
                        const short = hint.length > 90 ? `${hint.slice(0, 87).trimEnd()}…` : hint;
                        return (
                          <motion.button
                            key={i}
                            type="button"
                            role="listitem"
                            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: reduceMotion ? 0 : i * 0.06 }}
                            onClick={() => applyHint(hint)}
                            title={hint}
                            className="snap-start shrink-0 w-[min(88vw,280px)] rounded-xl border border-primary/35 bg-primary/5 px-4 py-3 text-left transition hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_24px_-10px_hsl(var(--primary)/0.45)] md:w-auto"
                          >
                            <span className="text-sm leading-snug text-foreground">{short}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">Нажмите — подставится в поле, можно отредактировать</p>
                  </motion.div>
                )}
                {p.aiHintError && !p.aiHintLoading && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
                  >
                    <p className="mb-2 text-muted-foreground">
                      {p.aiHintErrorMessage || "Не удалось загрузить примеры."}
                    </p>
                    {p.onRetryHints && (
                      <Button type="button" variant="outline" size="sm" onClick={p.onRetryHints}>
                        Повторить
                      </Button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Desktop navigation inside card */}
        <div className="mt-8 hidden items-center justify-between gap-3 md:flex">
          <Button type="button" variant="ghost" onClick={p.onBack}>
            ← Назад
          </Button>
          <div className="flex flex-col items-end gap-1">
            <Button
              type="button"
              onClick={() => {
                setTouched(true);
                p.onNext();
              }}
              disabled={!canNext}
              className={cn(
                "h-12 min-w-[160px] bg-gradient-money px-8 font-semibold text-primary-foreground shadow-glow transition-all",
                canNext ? "scale-100 opacity-100" : "scale-[0.98] opacity-40 shadow-none",
              )}
            >
              {p.nextLabel || "Дальше →"}
            </Button>
            <span className="text-[11px] text-muted-foreground">⌘/Ctrl + Enter</span>
          </div>
        </div>
      </div>

      {/* Mobile sticky footer */}
      <motion.div
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-4 py-3 backdrop-blur-xl pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden"
        initial={false}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={p.onBack} className="shrink-0">
            Назад
          </Button>
          <Button
            type="button"
            onClick={() => {
              setTouched(true);
              p.onNext();
            }}
            disabled={!canNext}
            className={cn(
              "h-11 flex-1 bg-gradient-money font-semibold text-primary-foreground shadow-glow transition-all",
              canNext ? "opacity-100" : "opacity-40 shadow-none",
            )}
          >
            {p.nextLabel || "Дальше →"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
