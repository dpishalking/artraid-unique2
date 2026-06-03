import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  ArrowRight,
  Loader2,
  Mail,
  Sparkles,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { QuizShell } from "@/components/quiz/QuizShell";
import {
  QUIZ_FEATURES,
  QUIZ_GOAL_OPTIONS,
  QUIZ_WELCOME_CREDITS,
} from "@/lib/quiz/constants";
import type { StartupMode } from "@/lib/ideaLab/types";
import { clearQuizDraft, loadQuizDraft, saveQuizDraft } from "@/lib/quiz/draft";
import { completeQuizFromDraft } from "@/lib/quiz/completeQuiz";
import type { MainGoal } from "@/lib/projects/types";
import type { QuizDraft, QuizStepId } from "@/lib/quiz/types";
import { authRedirectUrl } from "@/lib/auth/redirect";
import { useUnsavedWizardGuard } from "@/hooks/useUnsavedWizardGuard";
import { useWizardStepHistory } from "@/hooks/useWizardStepHistory";
import { quizStepFromIndex, quizStepToIndex } from "@/lib/navigation/wizardSteps";
import { cn } from "@/lib/utils";

const emailSchema = z.string().trim().email("Некорректный email");

const QUESTION_STEPS: QuizStepId[] = ["product", "audience", "goal", "website"];
const PROGRESS_STEPS: QuizStepId[] = ["intro", ...QUESTION_STEPS, "register"];

const BUILD_STAGES = [
  "Создаём проект",
  "Собираем карту маркетинга",
  "Готовим мастерскую проекта",
];

const slide = {
  initial: { opacity: 0, x: 24, filter: "blur(6px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: { opacity: 0, x: -24, filter: "blur(6px)" },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
};

function initialDraftValues() {
  const saved = loadQuizDraft();
  return {
    startupMode: "has_business" as StartupMode,
    productDescription: saved?.productDescription ?? "",
    targetAudience: saved?.targetAudience ?? "",
    mainGoal: (saved?.mainGoal ?? "increase_conversion") as MainGoal,
    website: saved?.website ?? "",
  };
}

export default function QuizPage() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const resume = searchParams.get("resume") === "1";

  const [draftBootstrap] = useState(() => initialDraftValues());
  const [step, setStep] = useState<QuizStepId>(() => {
    const raw = searchParams.get("step");
    const fromIdx = Number(raw);
    if (Number.isFinite(fromIdx) && fromIdx >= 0) {
      // Раньше в URL был лишний шаг situation (индекс 1); сдвигаем старые закладки step≥2
      const mappedIdx = fromIdx >= 2 ? fromIdx - 1 : fromIdx;
      const id = quizStepFromIndex(mappedIdx);
      if (id) return id;
    }
    return "intro";
  });
  const [startupMode, setStartupMode] = useState<StartupMode>(draftBootstrap.startupMode);
  const [productDescription, setProductDescription] = useState(draftBootstrap.productDescription);
  const [targetAudience, setTargetAudience] = useState(draftBootstrap.targetAudience);
  const [mainGoal, setMainGoal] = useState<MainGoal>(draftBootstrap.mainGoal);
  const [website, setWebsite] = useState(draftBootstrap.website);
  const [email, setEmail] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [buildStage, setBuildStage] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const draft = useMemo((): QuizDraft | null => {
    if (startupMode === "has_business") {
      if (!productDescription.trim() || !targetAudience.trim()) return null;
    } else if (startupMode === "has_idea") {
      if (!productDescription.trim()) return null;
    }
    return {
      startupMode,
      productDescription:
        productDescription.trim() ||
        (startupMode === "find_idea" ? "Идея уточняется в диалоге с наставником" : ""),
      targetAudience:
        targetAudience.trim() ||
        (startupMode !== "has_business" ? "Уточним в режиме «Проект с нуля»" : ""),
      mainGoal,
      website: website.trim() || undefined,
    };
  }, [startupMode, productDescription, targetAudience, mainGoal, website]);

  const persistDraft = useCallback(() => {
    if (draft) saveQuizDraft(draft);
  }, [draft]);

  const runFinish = useCallback(async () => {
    const d = loadQuizDraft() ?? draft;
    if (!d) {
      toast.error("Ответы квиза не найдены — пройдите заново");
      setStep("intro");
      return;
    }
    setFinishing(true);
    setStep("building");
    setBuildStage(0);
    try {
      const t1 = window.setTimeout(() => setBuildStage(1), 1200);
      const { redirectPath } = await completeQuizFromDraft(d);
      window.clearTimeout(t1);
      setBuildStage(2);
      await new Promise((r) => setTimeout(r, 600));
      window.location.replace(redirectPath);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать проект");
      setStep("register");
    } finally {
      setFinishing(false);
    }
  }, [draft, nav]);

  useEffect(() => {
    if (!resume) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      const fromStore = loadQuizDraft();
      if (session && (fromStore || draft)) {
        void runFinish();
      }
    });
  }, [resume, draft, runFinish]);

  const progressIndex = PROGRESS_STEPS.indexOf(step);
  const progressCount = PROGRESS_STEPS.length;

  const quizHasDraft =
    step !== "intro" &&
    step !== "building" &&
    (productDescription.trim().length > 0 ||
      targetAudience.trim().length > 0 ||
      website.trim().length > 0);
  useUnsavedWizardGuard(quizHasDraft && !finishing);

  const quizIndex = quizStepToIndex(step);
  const applyQuizIndex = useCallback((i: number) => {
    const next = quizStepFromIndex(i);
    if (next) {
      setStartupMode("has_business");
      setStep(next);
    }
  }, []);
  useWizardStepHistory(quizIndex ?? 0, applyQuizIndex, {
    enabled: quizIndex !== null && !finishing,
  });

  useEffect(() => {
    if (step === "situation") {
      setStartupMode("has_business");
      setStep("product");
    }
  }, [step]);

  const goNext = () => {
    if (step === "intro") {
      setStartupMode("has_business");
      setStep("product");
    } else if (step === "product") {
      if (productDescription.trim().length < 4) {
        toast.error("Опишите продукт хотя бы в одном предложении");
        return;
      }
      setStep("audience");
    } else if (step === "audience") {
      if (targetAudience.trim().length < 4) {
        toast.error("Опишите аудиторию");
        return;
      }
      setStep("goal");
    } else if (step === "goal") setStep("website");
    else if (step === "website") {
      persistDraft();
      setStep("register");
    }
  };

  const goBack = () => {
    if (step === "product") setStep("intro");
    else if (step === "audience") setStep("product");
    else if (step === "goal") setStep("audience");
    else if (step === "website") setStep("goal");
    else if (step === "register") setStep("website");
  };

  const handleMagicLink = async (e: FormEvent) => {
    e.preventDefault();
    const ev = emailSchema.safeParse(email);
    if (!ev.success) {
      toast.error(ev.error.issues[0].message);
      return;
    }
    if (!draft) {
      toast.error("Сначала ответьте на вопросы квиза");
      return;
    }
    saveQuizDraft(draft);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: ev.data,
        options: {
          emailRedirectTo: authRedirectUrl("/quiz?resume=1"),
        },
      });
      if (error) throw error;
      setEmailSent(true);
      toast.success("Ссылка отправлена — проверьте почту");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось отправить письмо");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleContinueLoggedIn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Сначала войдите по ссылке из письма");
      return;
    }
    persistDraft();
    await runFinish();
  };

  useEffect(() => {
    if (step !== "register") return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, [step]);

  return (
    <QuizShell
      stepIndex={step === "building" ? progressCount - 1 : Math.max(0, progressIndex)}
      stepCount={progressCount}
      showProgress={step !== "building"}
    >
      <AnimatePresence mode="wait">
        {step === "intro" && (
          <motion.div key="intro" {...slide} className="space-y-8">
            <motion.div className="space-y-4 text-center">
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
                Маркетинг как система,{" "}
                <span className="bg-gradient-money bg-clip-text text-transparent">
                  а не набор разовых задач
                </span>
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed">
                За 3–4 минуты вы расскажете о бизнесе — система соберёт{" "}
                <strong className="text-foreground font-medium">проект с памятью</strong>.
                Дальше аудит, оффер и лендинг — всё в одной мастерской проекта, без повторных брифов.
              </p>
            </motion.div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Один проект = карта маркетинга + история действий
              </li>
              <li className="flex gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                Типовое действие — 2–5 минут и пара кликов
              </li>
              <li className="flex gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {QUIZ_WELCOME_CREDITS} генераций на аккаунт после регистрации
              </li>
            </ul>
            <Button size="lg" className="w-full h-12 text-base" onClick={goNext}>
              Начать квиз
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === "product" && (
          <motion.div key="product" {...slide} className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-primary mb-2">Вопрос 1 из 4</p>
              <h2 className="font-display text-2xl font-bold">Что вы продаёте?</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Продукт или услуга — 1–3 предложения, как клиенту.
              </p>
            </div>
            <Textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="Например: онлайн-курс по запуску рекламы для экспертов…"
              className="min-h-[120px] text-base"
              autoFocus
            />
            <QuizNav onBack={goBack} onNext={goNext} />
          </motion.div>
        )}

        {step === "audience" && (
          <motion.div key="audience" {...slide} className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-primary mb-2">Вопрос 2 из 4</p>
              <h2 className="font-display text-2xl font-bold">Кому вы продаёте?</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Сегмент, ситуация, главная боль или желание.
              </p>
            </div>
            <Textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Например: владельцы малого бизнеса, которые сливают бюджет на рекламу…"
              className="min-h-[120px] text-base"
              autoFocus
            />
            <QuizNav onBack={goBack} onNext={goNext} />
          </motion.div>
        )}

        {step === "goal" && (
          <motion.div key="goal" {...slide} className="space-y-6">
            <motion.div>
              <p className="text-xs font-semibold text-primary mb-2">Вопрос 3 из 4</p>
              <h2 className="font-display text-2xl font-bold">Главная задача сейчас</h2>
            </motion.div>
            <div className="grid gap-2">
              {QUIZ_GOAL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMainGoal(opt.value)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    mainGoal === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <p className="font-medium text-sm">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.hint}</p>
                </button>
              ))}
            </div>
            <QuizNav onBack={goBack} onNext={goNext} />
          </motion.div>
        )}

        {step === "website" && (
          <motion.div key="website" {...slide} className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-primary mb-2">Вопрос 4 из 4</p>
              <h2 className="font-display text-2xl font-bold">Есть сайт или лендинг?</h2>
              <p className="text-sm text-muted-foreground mt-2">
                По желанию — сразу подставим в аудит. Можно пропустить.
              </p>
            </div>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="h-12"
            />
            <QuizNav onBack={goBack} onNext={goNext} nextLabel="К регистрации" />
          </motion.div>
        )}

        {step === "register" && (
          <motion.div key="register" {...slide} className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-bold">
                Сохраните проект и откройте мастерскую проекта
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Система <strong className="text-foreground">запоминает</strong> продукт,
                аудиторию и цель. Оффер, лендинг, письмо и аудит — в одном проекте, за минуты.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card/80 p-4 space-y-3">
              {QUIZ_FEATURES.map(({ icon: Icon, title, description, soon }) => (
                <div key={title} className="flex gap-3">
                  <motion.div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-medium">
                      {title}
                      {soon && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                          скоро
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm rounded-xl bg-money/10 border border-money/20 py-3 px-4">
              На аккаунт —{" "}
              <strong className="text-foreground">{QUIZ_WELCOME_CREDITS} генераций</strong>.
              Хватит на аудиты, офферы и прототипы по нескольким проектам.
            </p>

            {emailSent ? (
              <div className="space-y-4 text-center text-sm text-muted-foreground">
                <p>
                  Откройте письмо и перейдите по ссылке — мы создадим проект и карту маркетинга.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setEmailSent(false)}>
                  Отправить ещё раз
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quiz-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="quiz-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-12" disabled={authLoading}>
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Открыть мастерскую проекта
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={() => void handleContinueLoggedIn()}
              disabled={finishing}
            >
              Уже вошли — продолжить
            </Button>

            <button
              type="button"
              onClick={goBack}
              className="w-full text-xs text-muted-foreground hover:text-foreground"
            >
              ← Изменить ответы
            </button>
          </motion.div>
        )}

        {step === "building" && (
          <motion.div key="building" {...slide} className="space-y-8 py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <h2 className="font-display text-xl font-bold">Собираем ваш проект</h2>
              <p className="text-sm text-muted-foreground">Ещё несколько секунд…</p>
            </div>
            <ul className="space-y-3">
              {BUILD_STAGES.map((label, i) => {
                const state = i < buildStage ? "done" : i === buildStage ? "active" : "pending";
                return (
                  <li key={label} className="flex items-center gap-3 text-sm">
                    {state === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-money" />
                    ) : state === "active" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span
                      className={
                        state === "pending" ? "text-muted-foreground/60" : "text-foreground"
                      }
                    >
                      {label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </QuizShell>
  );
}

function QuizNav({
  onBack,
  onNext,
  nextLabel = "Далее",
}: {
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <Button type="button" variant="outline" className="flex-1 h-11" onClick={onBack}>
        Назад
      </Button>
      <Button type="button" className="flex-1 h-11" onClick={onNext}>
        {nextLabel}
        <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}
