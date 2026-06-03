import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { OfferPurposeStep } from "@/components/offer-generator/OfferPurposeStep";
import { OfferBriefStep } from "@/components/offer-generator/OfferBriefStep";
import { OfferToneStep } from "@/components/offer-generator/OfferToneStep";
import { OfferProgress } from "@/components/offer-generator/OfferProgress";
import { OfferLoadingState } from "@/components/offer-generator/OfferLoadingState";
import { OfferResultView } from "@/components/offer-generator/OfferResultView";
import { generateOffer } from "@/lib/offer-generator/api";
import { BRIEF_STEPS } from "@/lib/offer-generator/constants";
import { EMPTY_BRIEF } from "@/lib/offer-generator/types";
import type { OfferBrief, OfferPurpose, OfferResult, OfferTone } from "@/lib/offer-generator/types";
import { validateBriefForGeneration, validateBriefStepField } from "@/lib/offer-generator/validators";
import { useOfferHints } from "@/hooks/useOfferHints";
import { BRIEF_STEP_LABELS } from "@/lib/offer-generator/briefContext";
import { ProductLaneContextBanner } from "@/components/product/ProductLaneContextBanner";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { GuestDemoBanner } from "@/components/navigation/GuestDemoBanner";
import { useUnsavedWizardGuard } from "@/hooks/useUnsavedWizardGuard";
import { useWizardStepHistory } from "@/hooks/useWizardStepHistory";
import { useAuth } from "@/hooks/useAuth";
import { useEffectiveProjectId } from "@/hooks/useEffectiveProjectId";
import { offerWizardFromIndex, offerWizardToIndex } from "@/lib/navigation/wizardSteps";

type Phase = "purpose" | "brief" | "tone" | "loading" | "result" | "error";

export default function OfferGeneratorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const projectId = useEffectiveProjectId();
  const [purposeMountEpoch, setPurposeMountEpoch] = useState(0);

  /** Верхнее меню «Оффер» добавляет pick=vectors — экран выбора четырёх разделов, не список форматов. */
  useEffect(() => {
    if (searchParams.get("pick") !== "vectors") return;
    const next = new URLSearchParams(searchParams);
    next.delete("pick");
    setSearchParams(next, { replace: true });
    setPurposeMountEpoch((n) => n + 1);
  }, [searchParams, setSearchParams]);

  const authNext = projectId
    ? `/offer-generator?projectId=${encodeURIComponent(projectId)}`
    : "/offer-generator";
  const [phase, setPhase] = useState<Phase>(() => {
    const s = Number(searchParams.get("step"));
    if (Number.isFinite(s) && s >= 0) return offerWizardFromIndex(s).phase;
    return "purpose";
  });
  const [briefStep, setBriefStep] = useState(() => {
    const s = Number(searchParams.get("step"));
    if (Number.isFinite(s) && s >= 0) return offerWizardFromIndex(s).briefStep;
    return 0;
  });
  const [brief, setBrief] = useState<OfferBrief>({ ...EMPTY_BRIEF });
  const [result, setResult] = useState<OfferResult | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const {
    aiHints,
    clearHints,
    prefetchAfterFirstAnswer,
    prefetchAdvancedAnswers,
    ensureFieldHints,
    retryField,
    getStatus,
    getError,
    isLoading: isHintLoading,
  } = useOfferHints();
  const briefRef = useRef(brief);
  briefRef.current = brief;
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncBriefToMemory = useCallback(
    (nextBrief: OfferBrief, immediate = false) => {
      if (!projectId) return;
      const run = () => {
        import("@/lib/projectMemory/syncOfferBriefToProjectMemory")
          .then(({ syncOfferBriefToProjectMemory }) =>
            syncOfferBriefToProjectMemory(projectId, nextBrief),
          )
          .catch((e) => console.warn("offer brief → memory sync:", e));
      };
      if (immediate) {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        run();
        return;
      }
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      syncTimerRef.current = setTimeout(run, 700);
    },
    [projectId],
  );

  useEffect(
    () => () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    },
    [],
  );

  const currentBriefKey = BRIEF_STEPS[briefStep]?.key;
  const aiHintsEnabled = briefStep > 0;

  const wizardIndex = offerWizardToIndex(phase, briefStep);
  const applyWizardIndex = useCallback((i: number) => {
    const next = offerWizardFromIndex(i);
    setPhase(next.phase);
    setBriefStep(next.briefStep);
  }, []);
  useWizardStepHistory(wizardIndex ?? 0, applyWizardIndex, { enabled: wizardIndex !== null });

  useEffect(() => {
    if (phase !== "brief" || briefStep <= 0 || !currentBriefKey) return;
    ensureFieldHints(briefRef.current, currentBriefKey);
  }, [phase, briefStep, currentBriefKey, ensureFieldHints]);

  useEffect(() => {
    if (!projectId) return;
    import("@/lib/projects/projectApi").then(({ getProjectById }) =>
      import("@/lib/projects/prefill").then(({ offerBriefFromProject }) =>
        getProjectById(projectId).then((data) => {
          if (!data) return;
          setBrief((prev) => ({ ...prev, ...offerBriefFromProject(data.project, data.context) }));
        }),
      ),
    );
  }, [projectId]);

  const updateBrief = <K extends keyof OfferBrief>(key: K, value: OfferBrief[K]) => {
    setBrief((prev) => {
      const next = { ...prev, [key]: value };
      syncBriefToMemory(next);
      return next;
    });
    setFieldError(null);
  };

  const runGeneration = async () => {
    const err = validateBriefForGeneration(brief);
    if (err) {
      toast.error(err);
      setFieldError(err);
      return;
    }
    const prevPhase = phase;
    setGenLoading(true);
    if (prevPhase !== "result") setPhase("loading");
    try {
      const data = await generateOffer(brief, { projectId });
      setResult(data);
      setPhase("result");
      syncBriefToMemory(brief, true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось сгенерировать оффер.";
      toast.error(msg);
      setPhase(prevPhase === "result" ? "result" : "error");
    } finally {
      setGenLoading(false);
    }
  };

  const handleRestart = () => {
    setBrief({ ...EMPTY_BRIEF });
    setBriefStep(0);
    setResult(null);
    setFieldError(null);
    clearHints();
    setPhase("purpose");
    setPurposeMountEpoch((n) => n + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const showProgress = phase === "brief" || phase === "tone";
  const hasDraft = phase !== "purpose" || brief.offerPurpose !== "" || briefStep > 0;
  useUnsavedWizardGuard(hasDraft && phase !== "loading");
  const progressCurrent = phase === "tone" ? 8 : briefStep + 1;
  const progressStepLabel =
    phase === "tone" ? "Тон" : phase === "brief" ? BRIEF_STEP_LABELS[briefStep] : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
      </div>

      <FlowPageHeader hideExit title="Генератор офферов">
        <Megaphone className="h-4 w-4 text-primary hidden sm:block" />
      </FlowPageHeader>

      <main
        className={`mx-auto max-w-3xl px-4 py-8 md:py-12 md:px-6 ${phase === "brief" ? "pb-28 md:pb-12" : ""}`}
      >
        {!user && !projectId && <GuestDemoBanner authNext={authNext} variant="offer" />}
        <ProductLaneContextBanner projectId={projectId} className="mb-8" />

        {phase === "purpose" && (
          <div className="mb-8 rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
            <p className="text-muted-foreground text-sm md:text-base">
              Соберите оффер, который клиент поймёт за{" "}
              <span className="text-foreground font-semibold">5 секунд</span>
            </p>
          </div>
        )}

        {showProgress && (
          <div className="mb-8">
            <OfferProgress current={progressCurrent} total={8} stepLabel={progressStepLabel} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {phase === "purpose" && (
            <OfferPurposeStep
              key={`purpose-${purposeMountEpoch}`}
              brief={brief}
              onSelect={(p: OfferPurpose) => updateBrief("offerPurpose", p)}
              onCustomChange={(v) => updateBrief("customPurpose", v)}
              onQuickStart={() => {
                updateBrief("offerPurpose", "landing_hero");
                setPhase("brief");
                setBriefStep(0);
                syncBriefToMemory({ ...briefRef.current, offerPurpose: "landing_hero" }, true);
              }}
              onNext={() => {
                const err = validateBriefStepField("offerPurpose", brief);
                if (err) {
                  setFieldError(err);
                  return;
                }
                setPhase("brief");
                setBriefStep(0);
                syncBriefToMemory(briefRef.current, true);
              }}
              error={fieldError}
            />
          )}

          {phase === "brief" && (
            <OfferBriefStep
              key={`brief-${briefStep}`}
              stepIndex={briefStep}
              brief={brief}
              onChange={(key, value) => updateBrief(key, value)}
              fieldError={fieldError}
              showValidation={validationAttempted}
              onBack={() => {
                setFieldError(null);
                setValidationAttempted(false);
                if (briefStep === 0) setPhase("purpose");
                else setBriefStep((s) => s - 1);
              }}
              onNext={() => {
                const step = BRIEF_STEPS[briefStep];
                if (step?.required) {
                  const err = validateBriefStepField(step.key, brief);
                  if (err) {
                    setFieldError(err);
                    setValidationAttempted(true);
                    return;
                  }
                }
                setFieldError(null);
                setValidationAttempted(false);
                syncBriefToMemory(briefRef.current, true);
                if (briefStep === 0) {
                  clearHints();
                  prefetchAfterFirstAnswer(briefRef.current);
                } else if (briefStep === 3) {
                  prefetchAdvancedAnswers(briefRef.current);
                }
                if (briefStep >= BRIEF_STEPS.length - 1) setPhase("tone");
                else setBriefStep((s) => s + 1);
              }}
              aiHintsEnabled={aiHintsEnabled}
              aiHint={aiHintsEnabled && currentBriefKey ? aiHints[currentBriefKey] : undefined}
              aiHintLoading={aiHintsEnabled && currentBriefKey ? isHintLoading(currentBriefKey) : false}
              aiHintError={aiHintsEnabled && currentBriefKey ? getStatus(currentBriefKey) === "error" : false}
              aiHintErrorMessage={
                aiHintsEnabled && currentBriefKey ? getError(currentBriefKey) : undefined
              }
              onRetryHints={
                aiHintsEnabled && currentBriefKey
                  ? () => retryField(briefRef.current, currentBriefKey)
                  : undefined
              }
            />
          )}

          {phase === "tone" && (
            <OfferToneStep
              key="tone"
              brief={brief}
              onSelect={(t: OfferTone) => updateBrief("tone", t)}
              onAdditionalContextChange={(value) => updateBrief("additionalContext", value)}
              onBack={() => {
                setPhase("brief");
                setBriefStep(BRIEF_STEPS.length - 1);
              }}
              onSubmit={runGeneration}
              loading={genLoading}
            />
          )}

          {(phase === "loading" || (phase === "result" && genLoading)) && (
            <OfferLoadingState key="loading" />
          )}

          {phase === "error" && (
            <div key="error" className="text-center py-16 space-y-6">
              <p className="text-muted-foreground max-w-md mx-auto">
                Не удалось сгенерировать оффер. Попробуйте ещё раз или сократите описание.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={() => setPhase("tone")} className="bg-gradient-money text-primary-foreground">
                  Попробовать снова
                </Button>
                <Button variant="outline" onClick={handleRestart}>
                  Начать заново
                </Button>
              </div>
            </div>
          )}

          {phase === "result" && result && !genLoading && (
            <OfferResultView
              key="result"
              brief={brief}
              result={result}
              projectId={projectId}
              onRegenerate={runGeneration}
              onRestart={handleRestart}
              loading={genLoading}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
