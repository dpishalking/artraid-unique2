import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Mic, MicOff, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import type { BriefQuestion } from "@/config/landingScenarios";
import {
  builderAiIsland,
  builderBody,
  builderCardGlow,
  builderHeading,
  builderInputClass,
  builderMuted,
  builderStepLabel,
  builderSubpanel,
  builderWorkspace,
  builderWorkspacePadding,
} from "@/components/builder/builderStyles";

type Props = {
  stepNumber: number;
  totalSteps: number;
  question: BriefQuestion;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  showBriefIntro?: boolean;
  briefIntro?: string;
  aiHintsEnabled?: boolean;
  aiHint?: string[];
  aiHintLoading?: boolean;
  aiHintError?: boolean;
  onRetryHints?: () => void;
  phaseLabel?: string;
};

export function ScenarioQuestionCard({
  stepNumber,
  totalSteps,
  question,
  value,
  onChange,
  onNext,
  onBack,
  showBriefIntro,
  briefIntro,
  aiHintsEnabled = false,
  aiHint,
  aiHintLoading,
  aiHintError,
  onRetryHints,
  phaseLabel,
}: Props) {
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const speech = useSpeechInput((t) => onChange(t));
  const multiline = question.type === "textarea";

  useEffect(() => {
    ref.current?.focus();
  }, [question.id]);

  const canNext = question.required ? value.trim().length >= 2 : true;
  const showHintSection =
    aiHintsEnabled && (aiHintLoading || (aiHint && aiHint.length > 0) || aiHintError);

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canNext) onNext();
  };

  const inputClass = multiline
    ? `min-h-[140px] pr-12 p-4 text-base leading-relaxed placeholder:text-sm placeholder:italic ${builderInputClass}`
    : `pr-12 h-12 text-base ${builderInputClass}`;

  return (
    <div className={`${builderWorkspace} ${builderWorkspacePadding}`}>
      <div className={builderCardGlow} aria-hidden />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-mono ${builderMuted}`}>
            {stepNumber} / {totalSteps}
          </span>
          <span className={builderStepLabel}>{phaseLabel ?? "Бриф"}</span>
        </div>

        {showBriefIntro && (
          <div className={`mb-6 ${builderSubpanel} px-5 py-4`}>
            <p className={`${builderStepLabel} mb-2`}>Контекст сценария</p>
            <h2 className={`${builderHeading} text-xl mb-1`}>Задайте фундамент</h2>
            {briefIntro && <p className={`text-sm ${builderBody} leading-relaxed`}>{briefIntro}</p>}
          </div>
        )}

        <h2 className={`${builderHeading} text-2xl md:text-3xl mb-1 leading-snug`}>{question.label}</h2>
        {question.helperText && <p className={`${builderBody} text-sm mb-5`}>{question.helperText}</p>}

        <div className="relative">
          {multiline ? (
            <Textarea
              ref={ref as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.placeholder}
              className={inputClass}
              onKeyDown={handleKey}
            />
          ) : (
            <Input
              ref={ref as React.RefObject<HTMLInputElement>}
              type={question.type === "url" ? "url" : question.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={question.placeholder}
              className={inputClass}
              onKeyDown={handleKey}
            />
          )}
          {speech.supported && (
            <button
              type="button"
              onClick={speech.toggle}
              aria-label="Голосом"
              className={`absolute right-2 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
                speech.listening ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </button>
          )}
        </div>

        {showHintSection && (
          <div className={`mt-8 ${builderAiIsland} p-4`}>
            <AnimatePresence mode="wait">
              {aiHintLoading && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                  AI подбирает примеры под ваш сценарий…
                </div>
              )}
              {!aiHintLoading && aiHint && aiHint.length > 0 && (
                <div key="hints">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-3 w-3 text-primary" />
                    <span className={builderStepLabel}>AI · Примеры для этого вопроса</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 snap-x sm:grid sm:grid-cols-2 sm:overflow-visible">
                    {aiHint.map((hint, i) => {
                      const short = hint.length > 100 ? `${hint.slice(0, 97).trimEnd()}…` : hint;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => onChange(hint)}
                          title={hint}
                          className="snap-start shrink-0 w-[min(100%,280px)] sm:w-auto text-left rounded-xl border-2 border-primary/40 bg-secondary/50 px-4 py-3 text-sm text-foreground hover:border-primary hover:bg-primary/10 transition"
                        >
                          {short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {aiHintError && !aiHintLoading && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                  <p className="text-muted-foreground mb-2">Не удалось загрузить AI-примеры.</p>
                  {onRetryHints && (
                    <Button type="button" variant="outline" size="sm" onClick={onRetryHints}>
                      Повторить
                    </Button>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Назад
          </Button>
          <Button
            onClick={onNext}
            disabled={!canNext}
            className="flex-1 bg-gradient-money text-primary-foreground font-semibold shadow-glow disabled:opacity-45"
          >
            Дальше →
          </Button>
        </div>
      </div>
    </div>
  );
}
