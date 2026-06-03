import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2, Sparkles, ArrowRight, LogIn, LogOut, FileText, Mic, MicOff, Target, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { useEffectiveProjectId } from "@/hooks/useEffectiveProjectId";
import { CREDITS_ENABLED } from "@/config/features";
import { useSpeechInput } from "@/hooks/useSpeechInput";
import { useScenarioHints } from "@/hooks/useScenarioHints";
import { ScenarioPicker } from "@/components/builder/ScenarioPicker";
import { ScenarioQuestionCard } from "@/components/builder/ScenarioQuestionCard";
import { BuilderStructureStepper } from "@/components/builder/BuilderStructureStepper";
import { BuilderBriefSidebar } from "@/components/builder/BuilderBriefSidebar";
import { GenerationOverlay } from "@/components/builder/GenerationOverlay";
import {
  builderBody,
  builderHeader,
  builderHeading,
  builderPage,
  builderWorkspace,
  builderWorkspacePadding,
} from "@/components/builder/builderStyles";
import { ProductLaneContextBanner } from "@/components/product/ProductLaneContextBanner";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { GuestDemoBanner } from "@/components/navigation/GuestDemoBanner";
import { BuilderAuthGate } from "@/components/builder/BuilderAuthGate";
import { useUnsavedWizardGuard } from "@/hooks/useUnsavedWizardGuard";
import { useWizardStepHistory } from "@/hooks/useWizardStepHistory";
import { getActiveStructureIndex } from "@/lib/builderProgress";
import {
  getScenarioById,
  validateScenarioAnswers,
  calcBriefCompleteness,
  briefDisplayTitle,
  type ScenarioBriefPayload,
} from "@/config/landingScenarios";
import { consumeOfferPrototypePrefill } from "@/lib/offer-generator/prototypeHandoff";

type RecentRow = {
  id: string;
  brief: Record<string, unknown>;
  status: string;
  created_at: string;
};

export default function Builder() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = useEffectiveProjectId();
  const { user, loading: authLoading } = useAuth();
  const { balance, loading: creditsLoading, refresh: refreshCredits } = useCredits();
  const showCredits = CREDITS_ENABLED;
  const [step, setStep] = useState(() => {
    const fromUrl = Number(searchParams.get("step"));
    return Number.isFinite(fromUrl) && fromUrl >= 0 ? fromUrl : 0;
  });
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [competitorUrl, setCompetitorUrl] = useState("");
  const [ownSiteUrl, setOwnSiteUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [projectPrefillReady, setProjectPrefillReady] = useState(false);
  const projectPoolRef = useRef<Record<string, string> | null>(null);
  const lastPrefilledScenarioRef = useRef<string | null>(null);
  const autoAdvancedToBriefRef = useRef(false);
  const fromOfferHandoff = searchParams.get("fromOffer") === "1";
  const {
    aiHints,
    clearHints,
    prefetchAfterFirstQuestion,
    prefetchAdvancedQuestions,
    retryField,
    getStatus,
    isLoading: isHintLoading,
  } = useScenarioHints();
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const scenario = getScenarioById(selectedScenarioId);
  const questionCount = scenario?.questions.length ?? 0;
  const totalSteps = 1 + questionCount + 1; // сценарий + вопросы + финал с URL

  useWizardStepHistory(step, setStep, { enabled: Boolean(scenario) || step > 0 });

  const handleScenarioChange = (id: string) => {
    setSelectedScenarioId(id);
    setAnswers({});
    clearHints();
    lastPrefilledScenarioRef.current = null;

    if (fromOfferHandoff || !projectPoolRef.current) return;
    import("@/lib/projects/prefill").then(({ scenarioAnswersForScenario }) => {
      const mapped = scenarioAnswersForScenario(id, projectPoolRef.current!);
      const count = Object.keys(mapped).length;
      if (!count) return;
      setAnswers(mapped);
      toast.success(`Подставили ${count} полей из проекта — проверьте и дополните`);
      lastPrefilledScenarioRef.current = id;
    });
  };

  const authNext = projectId
    ? `/prototype?projectId=${encodeURIComponent(projectId)}`
    : "/prototype";

  const hasWizardDraft = step > 0 || Object.keys(answers).length > 0;
  useUnsavedWizardGuard(hasWizardDraft && !loading);

  useEffect(() => {
    if (!user) return;
    let query = supabase
      .from("prototypes")
      .select("id, brief, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    if (projectId) {
      query = query.eq("project_id", projectId);
    }
    query.then(({ data }) => setRecent((data as RecentRow[]) || []));
  }, [user, projectId]);

  useEffect(() => {
    if (!projectId || fromOfferHandoff) return;
    let cancelled = false;
    (async () => {
      const [{ getProjectById }, { getProjectMemoryRow }, { mergeStoredMemoryIntoSections }, prefill] =
        await Promise.all([
          import("@/lib/projects/projectApi"),
          import("@/lib/projectMemory/api"),
          import("@/lib/projectMemory/mergeSections"),
          import("@/lib/projects/prefill"),
        ]);
      const data = await getProjectById(projectId);
      if (!data || cancelled) return;

      const memRow = await getProjectMemoryRow(projectId).catch(() => null);
      const memory = memRow
        ? mergeStoredMemoryIntoSections(memRow as unknown as Record<string, unknown>)
        : null;
      const { project, context } = data;

      if (project.current_website_url) setOwnSiteUrl(project.current_website_url);
      const comp = project.competitors?.[0]?.url;
      if (comp) setCompetitorUrl(comp);

      projectPoolRef.current = prefill.buildScenarioAnswerPool({ project, context, memory });
      setProjectPrefillReady(true);
      setSelectedScenarioId((prev) => prev || prefill.defaultScenarioIdForProject(project));
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, fromOfferHandoff]);

  useEffect(() => {
    if (!projectPrefillReady || !selectedScenarioId || fromOfferHandoff) return;
    const pool = projectPoolRef.current;
    if (!pool) return;

    import("@/lib/projects/prefill").then(({ scenarioAnswersForScenario, mergeEmptyAnswers }) => {
      const mapped = scenarioAnswersForScenario(selectedScenarioId, pool);
      const count = Object.keys(mapped).length;
      setAnswers((prev) => mergeEmptyAnswers(prev, mapped));

      if (lastPrefilledScenarioRef.current !== selectedScenarioId && count > 0) {
        toast.success(`Подставили ${count} полей из проекта — проверьте и дополните`);
        lastPrefilledScenarioRef.current = selectedScenarioId;
        if (step === 0 && !autoAdvancedToBriefRef.current) {
          setStep(1);
          autoAdvancedToBriefRef.current = true;
        }
      }
    });
  }, [projectPrefillReady, selectedScenarioId, fromOfferHandoff, step]);

  useEffect(() => {
    if (searchParams.get("fromOffer") !== "1") return;
    const prefill = consumeOfferPrototypePrefill();
    if (!prefill) return;

    const scenario = getScenarioById(prefill.scenarioId);
    if (!scenario) return;

    const filtered: Record<string, string> = {};
    for (const q of scenario.questions) {
      const v = prefill.answers[q.id]?.trim();
      if (v) filtered[q.id] = v;
    }

    setSelectedScenarioId(prefill.scenarioId);
    setAnswers(filtered);
    setStep(1);
    toast.success("Подставили данные из оффера — проверьте бриф и соберите прототип");
  }, [searchParams]);

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const completeness = useMemo(() => {
    if (!scenario) return { score: 0, label: "—", color: "text-muted-foreground" };
    return calcBriefCompleteness(scenario, answers);
  }, [scenario, answers]);

  const questionIndex = step - 1;
  const aiHintsEnabled = questionIndex > 0;

  const submit = async () => {
    if (!scenario) {
      toast.error("Выберите сценарий лендинга, чтобы сервис собрал структуру под вашу задачу.");
      setStep(0);
      return;
    }
    const validationError = validateScenarioAnswers(scenario, answers);
    if (validationError) {
      toast.error(validationError);
      const firstMissing = scenario.questions.find(
        (q) => q.required && (answers[q.id]?.trim().length ?? 0) < 2,
      );
      if (firstMissing) {
        const idx = scenario.questions.indexOf(firstMissing);
        setStep(1 + idx);
      }
      return;
    }

    setLoading(true);
    try {
      const brief: ScenarioBriefPayload = {
        scenario_id: scenario.id,
        answers,
        competitor_url: competitorUrl.trim() || undefined,
        own_site_url: ownSiteUrl.trim() || undefined,
      };
      const { data: { session } } = await supabase.auth.getSession();
      const anonOrSession = session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-prototype`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${anonOrSession}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          brief,
          ...(user && projectId ? { project_id: projectId } : {}),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (showCredits && (r.status === 402 || data.error === "no_credits")) {
          toast.error(data.message || "Недостаточно генераций — пополните баланс");
          nav("/pricing");
          return;
        }
        if (r.status === 429 || data.error === "rate_limit") {
          toast.error(data.message || "Слишком много запросов, попробуйте позже");
          return;
        }
        if (r.status === 403 && data.error === "guest_no_project") {
          toast.error(data.message || "Войдите, чтобы сохранить прототип в проект");
          nav(`/auth?next=${encodeURIComponent(authNext)}`);
          return;
        }
        toast.error(data.error || data.message || "Ошибка генерации");
        return;
      }
      if (showCredits) refreshCredits();
      toast.success("Прототип готов!");
      nav(`/p/${data.id}`);
    } catch {
      toast.error("Не удалось сгенерировать. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  const progress = totalSteps > 0 ? ((step + 1) / totalSteps) * 100 : 0;
  const isFinalStep = scenario && step === totalSteps - 1;
  const currentQuestion = scenario && questionIndex >= 0 && questionIndex < questionCount
    ? scenario.questions[questionIndex]
    : null;

  const structureActiveIdx =
    scenario && step > 0
      ? getActiveStructureIndex(scenario, questionIndex, questionCount, !!isFinalStep)
      : 0;
  const phaseLabel = scenario?.landingStructure[structureActiveIdx]?.title;

  if (!authLoading && projectId && !user) {
    return (
      <div className={`${builderPage} relative`}>
        <FlowPageHeader hideExit title="Прототип лендинга" />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <BuilderAuthGate nextPath={authNext} />
        </main>
      </div>
    );
  }

  return (
    <motion.div className={`${builderPage} relative`}>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[500px] rounded-full bg-money/6 blur-[100px]" />
      </div>

      <motion.div className={builderHeader}>
        <FlowPageHeader
          hideExit
          title="Прототип лендинга"
          sticky={false}
          className="border-b-0 bg-transparent backdrop-blur-none"
        >
          <motion.div className="flex items-center gap-2 sm:gap-4 text-sm" layout>
            {scenario && step > 0 && (
              <div className="hidden sm:flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Заполнено:</span>
                <motion.span
                  key={completeness.score}
                  initial={{ scale: 1.2, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`text-sm font-bold tabular-nums ${completeness.color}`}
                >
                  {completeness.score}%
                </motion.span>
              </div>
            )}
            {showCredits && user && !creditsLoading && balance !== null && (
              <Link
                to="/pricing"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary tabular-nums"
              >
                {balance} {balance === 1 ? "генерация" : balance < 5 ? "генерации" : "генераций"}
              </Link>
            )}
            {showCredits && user && (
              <Link to="/pricing">
                <Button size="sm" className="h-8 rounded-lg bg-gradient-money text-primary-foreground text-xs font-semibold shadow-glow px-3">
                  <Zap className="h-3.5 w-3.5 mr-1" /> Купить генерации
                </Button>
              </Link>
            )}
            {!user && (
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" asChild>
                <Link to={`/auth?next=${encodeURIComponent(authNext)}`}>
                  <LogIn className="h-3.5 w-3.5 mr-1" /> Войти
                </Link>
              </Button>
            )}
            {user && (
              <span className="text-muted-foreground hidden md:inline">{user.email}</span>
            )}
            {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                nav("/cabinet");
              }}
            >
              <LogOut className="h-4 w-4 mr-1.5" /> Выйти
            </Button>
            )}
          </motion.div>
        </FlowPageHeader>
        <div className="h-1 bg-muted overflow-hidden mx-auto max-w-6xl px-6">
          <motion.div
            className="h-full bg-gradient-money"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </motion.div>

      <main className="mx-auto max-w-6xl px-6 py-8 md:py-12">
        {authLoading ? (
          <div className={`${builderWorkspace} ${builderWorkspacePadding} max-w-lg mx-auto flex flex-col items-center gap-4 py-12`}>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className={`${builderBody} text-sm`}>Загружаем сессию…</p>
          </div>
        ) : (
        <>
        {!user && !projectId && <GuestDemoBanner authNext={authNext} variant="prototype" />}
        <ProductLaneContextBanner projectId={projectId} className="mb-6" />
        {step === 0 && (
          <div className="mb-8 text-center md:text-left">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">Прототип лендинга</h1>
            <p className="text-muted-foreground text-sm">Сценарий → бриф → готовая структура страницы</p>
          </div>
        )}

        <div
          className={
            scenario && step > 0
              ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]"
              : "max-w-2xl mx-auto"
          }
        >
          <div className="min-w-0">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <ScenarioPicker
              key="scenario"
              stepNumber={1}
              totalSteps={totalSteps}
              value={selectedScenarioId}
              onChange={handleScenarioChange}
              onNext={() => {
                if (!selectedScenarioId) {
                  toast.error("Выберите сценарий лендинга, чтобы сервис собрал структуру под вашу задачу.");
                  return;
                }
                setStep(1);
              }}
            />
          )}

          {currentQuestion && scenario && (
            <ScenarioQuestionCard
              key={currentQuestion.id}
              stepNumber={step + 1}
              totalSteps={totalSteps}
              question={currentQuestion}
              value={answers[currentQuestion.id] ?? ""}
              onChange={(v) => setAnswer(currentQuestion.id, v)}
              showBriefIntro={questionIndex === 0}
              briefIntro={scenario.briefIntro}
              onBack={() => setStep((s) => s - 1)}
              onNext={() => {
                if (currentQuestion.required && (answers[currentQuestion.id]?.trim().length ?? 0) < 2) {
                  toast.error("Заполните это поле — минимум пара слов");
                  return;
                }
                if (questionIndex === 0) {
                  clearHints();
                  prefetchAfterFirstQuestion(scenario, answersRef.current);
                } else if (questionIndex === 3 && scenario.questions.length > 4) {
                  prefetchAdvancedQuestions(scenario, answersRef.current);
                }
                setStep((s) => s + 1);
              }}
              phaseLabel={phaseLabel}
              aiHintsEnabled={aiHintsEnabled}
              aiHint={aiHintsEnabled ? aiHints[currentQuestion.id] : undefined}
              aiHintLoading={aiHintsEnabled && isHintLoading(currentQuestion.id)}
              aiHintError={aiHintsEnabled && getStatus(currentQuestion.id) === "error"}
              onRetryHints={
                aiHintsEnabled
                  ? () => retryField(scenario, answersRef.current, currentQuestion.id)
                  : undefined
              }
            />
          )}

          {isFinalStep && scenario && (
            <FinalStep
              key="final"
              stepNumber={totalSteps}
              totalSteps={totalSteps}
              scenarioTitle={scenario.title}
              competitor={competitorUrl}
              own={ownSiteUrl}
              setCompetitor={setCompetitorUrl}
              setOwn={setOwnSiteUrl}
              loading={loading}
              creditsEnabled={showCredits}
              creditBalance={balance}
              creditsLoading={creditsLoading}
              completeness={completeness}
              guestMode={!user}
              onBack={() => setStep((s) => s - 1)}
              onSubmit={submit}
            />
          )}
        </AnimatePresence>

        {scenario && step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <BuilderStructureStepper
              scenario={scenario}
              questionIndex={questionIndex}
              questionCount={questionCount}
              isFinalStep={!!isFinalStep}
              compact
            />
          </motion.div>
        )}

        {step === 0 && user && recent.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-16">
            <motion.div className="flex items-center justify-between mb-3" layout>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {projectId ? "Прототипы проекта" : "Недавние прототипы"}
              </h2>
              {projectId ? (
                <Link
                  to={`/projects/${projectId}/prototypes`}
                  className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  Все прототипы <ArrowRight className="h-3 w-3" />
                </Link>
              ) : (
                <Link
                  to="/cabinet"
                  className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  К проектам <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </motion.div>
            <div className="space-y-2">
              {recent.map((r) => (
                <Link
                  key={r.id}
                  to={`/p/${r.id}`}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/50 transition"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <motion.div className="text-sm font-medium truncate" layout>
                      {briefDisplayTitle(r.brief)}
                    </motion.div>
                    <motion.div className="text-xs text-muted-foreground" layout>
                      {new Date(r.created_at).toLocaleString("ru-RU")} · {r.status}
                    </motion.div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
          </div>

          {scenario && step > 0 && (
            <aside className="hidden lg:block">
              <BuilderBriefSidebar
                scenario={scenario}
                answers={answers}
                completeness={completeness}
                currentQuestionId={currentQuestion?.id}
              />
            </aside>
          )}
        </div>
        </>
        )}
      </main>

      {scenario && (
        <GenerationOverlay
          open={loading}
          scenarioTitle={scenario.title}
          blockCount={scenario.landingStructure.length}
        />
      )}
    </motion.div>
  );
}

function UrlInputWithMic({ id, value, onChange, placeholder }: {
  id: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  const speech = useSpeechInput((t) => onChange(t));
  return (
    <div className="relative">
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={500} className="pr-12" />
      {speech.supported && (
        <button
          type="button"
          onClick={speech.toggle}
          aria-label="Голосом"
          className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
            speech.listening ? "text-destructive animate-pulse" : "text-muted-foreground hover:text-primary"
          }`}
        >
          {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

function FinalStep({
  stepNumber, totalSteps, scenarioTitle, competitor, own, setCompetitor, setOwn,
  loading, creditsEnabled, creditBalance, creditsLoading, completeness, guestMode, onBack, onSubmit,
}: {
  stepNumber: number; totalSteps: number; scenarioTitle: string;
  competitor: string; own: string;
  setCompetitor: (v: string) => void; setOwn: (v: string) => void;
  loading: boolean;
  creditsEnabled: boolean;
  creditBalance: number | null;
  creditsLoading: boolean;
  completeness: { score: number; label: string; color: string };
  guestMode?: boolean;
  onBack: () => void; onSubmit: () => void;
}) {
  const noCredits =
    creditsEnabled && !guestMode && !creditsLoading && creditBalance !== null && creditBalance < 1;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`${builderWorkspace} ${builderWorkspacePadding}`}
    >
      <div className={`mb-3 flex items-center gap-2 text-xs font-medium ${builderBody}`}>
        <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 font-semibold">Финал</span>
        <span>Шаг {stepNumber} из {totalSteps}</span>
        <span>· {scenarioTitle}</span>
      </div>
      <h2 className={`${builderHeading} text-3xl md:text-4xl leading-tight`}>
        Почти всё. Хотите подкинуть AI ссылок для контекста?
      </h2>
      <p className={`mt-3 text-base ${builderBody}`}>
        Не обязательно — но ссылки помогают точнее собрать прототип под сценарий «{scenarioTitle}».
      </p>

      <div className="mt-8 space-y-5 rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 p-6">
        <motion.div className="space-y-1.5" layout>
          <Label htmlFor="competitor_url">Сайт конкурента</Label>
          <UrlInputWithMic id="competitor_url" value={competitor} onChange={setCompetitor} placeholder="https://competitor.com" />
        </motion.div>
        <motion.div className="space-y-1.5" layout>
          <Label htmlFor="own_site_url">Ваш текущий сайт</Label>
          <UrlInputWithMic id="own_site_url" value={own} onChange={setOwn} placeholder="https://yoursite.com" />
        </motion.div>
      </div>

      <motion.div
        className="mt-6 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3"
        layout
      >
        <Target className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div className="h-full rounded-full bg-gradient-money" animate={{ width: `${completeness.score}%` }} />
        </div>
        <span className={`text-lg font-bold tabular-nums ${completeness.color}`}>{completeness.score}%</span>
      </motion.div>

      {noCredits && (
        <p className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Нет доступных генераций.{" "}
          <Link to="/pricing" className="font-semibold underline underline-offset-2">
            Купить пакет
          </Link>
        </p>
      )}

      <motion.div className="mt-6 flex items-center justify-between gap-3">
        <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>← Назад</Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={loading || noCredits}
          className="h-14 px-10 text-base font-semibold shadow-glow bg-gradient-money text-primary-foreground hover:scale-[1.01] transition-transform disabled:opacity-50"
        >
          <Sparkles className="mr-2 h-5 w-5" /> Собрать прототип
        </Button>
      </motion.div>
    </motion.div>
  );
}
