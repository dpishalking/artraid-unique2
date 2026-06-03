import type { OfferBrief } from "@/lib/offer-generator/types";
import { BRIEF_STEPS } from "@/lib/offer-generator/constants";
import { BRIEF_STEP_LABELS, getBriefContextLine } from "@/lib/offer-generator/briefContext";
import { OfferBriefStepCard } from "@/components/offer-generator/OfferBriefStepCard";

type BriefField = (typeof BRIEF_STEPS)[number]["key"];

type Props = {
  stepIndex: number;
  brief: OfferBrief;
  onChange: (key: BriefField, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  fieldError?: string | null;
  showValidation?: boolean;
  aiHintsEnabled?: boolean;
  aiHint?: string[];
  aiHintLoading?: boolean;
  aiHintError?: boolean;
  aiHintErrorMessage?: string;
  onRetryHints?: () => void;
};

export function OfferBriefStep({
  stepIndex,
  brief,
  onChange,
  onNext,
  onBack,
  fieldError,
  showValidation,
  aiHintsEnabled,
  aiHint,
  aiHintLoading,
  aiHintError,
  aiHintErrorMessage,
  onRetryHints,
}: Props) {
  const step = BRIEF_STEPS[stepIndex];
  if (!step) return null;

  const value = brief[step.key] as string;

  return (
    <OfferBriefStepCard
      stepNumber={stepIndex + 1}
      totalSteps={8}
      stepLabel={BRIEF_STEP_LABELS[stepIndex] ?? `Шаг ${stepIndex + 1}`}
      question={step.question}
      hint={step.hint}
      contextLine={getBriefContextLine(stepIndex, brief)}
      placeholder={step.placeholder}
      value={value}
      onChange={(v) => onChange(step.key, v)}
      onNext={onNext}
      onBack={onBack}
      required={step.required}
      nextLabel={stepIndex === BRIEF_STEPS.length - 1 ? "Выбрать тон →" : undefined}
      fieldError={fieldError}
      showValidation={showValidation}
      aiHint={aiHintsEnabled ? aiHint : undefined}
      aiHintLoading={Boolean(aiHintsEnabled && aiHintLoading)}
      aiHintError={Boolean(aiHintsEnabled && aiHintError)}
      aiHintErrorMessage={aiHintsEnabled ? aiHintErrorMessage : undefined}
      onRetryHints={aiHintsEnabled ? onRetryHints : undefined}
    />
  );
}
