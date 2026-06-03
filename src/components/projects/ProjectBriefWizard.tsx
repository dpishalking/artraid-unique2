import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  FileUp,
  Loader2,
  Mic,
  MicOff,
  Paperclip,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { completeQuizFromDraft } from "@/lib/quiz/completeQuiz";
import { saveProjectMemorySection } from "@/lib/projectMemory/api";
import type { MainGoal } from "@/lib/projects/types";
import {
  BRIEF_QUESTIONS,
  clearBriefDraft,
  loadBriefDraft,
  mapBriefAnswersToMemory,
  questionAcceptsAiHints,
  saveBriefDraft,
  type BriefAnswers,
  type BriefQuestion,
} from "@/lib/projects/briefStorage";
import type { ProjectMemorySections } from "@/lib/projectMemory/types";
import { useBriefHints } from "@/hooks/useBriefHints";
import { uploadProjectContextFile } from "@/lib/projectFiles/api";
import { MAX_UPLOAD_BYTES } from "@/lib/projectFiles/extractText";
import { BriefCompletionGuide } from "@/components/projects/BriefCompletionGuide";

type Props = {
  variant?: "page" | "sheet";
  onComplete?: (projectId: string, nextPath?: string) => void;
  onCancel?: () => void;
};

const TOTAL = BRIEF_QUESTIONS.length;

type BriefPendingFile = {
  id: string;
  file: File;
};

const BUILD_STAGES = ["Создаём проект…", "Заполняем память…", "Загружаем документы…", "Готовим мастерскую…"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function contentWidth(isSheet: boolean) {
  return isSheet ? "max-w-lg" : "max-w-3xl";
}

/* ─── slide animation ──────────────────────────────────────────────── */
function slide(dir: 1 | -1) {
  return {
    initial: { opacity: 0, x: dir * 40, filter: "blur(6px)" },
    animate: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: dir * -40, filter: "blur(6px)" },
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  };
}

/* ─── step celebration ─────────────────────────────────────────────── */
const CONFETTI_COLORS = ["#fbbf24", "#f59e0b", "#34d399", "#f472b6", "#818cf8", "#fb923c"];

function StepCelebration({
  message,
  detail,
  stepNum,
  total,
  onDone,
}: {
  message: string;
  detail: string;
  stepNum: number;
  total: number;
  onDone: () => void;
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        angle: (i / 28) * 360 + (i % 3) * 8,
        dist: 70 + (i % 5) * 28,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        w: 5 + (i % 4),
        h: 5 + (i % 3),
        delay: (i % 7) * 0.025,
        rotate: (i * 47) % 360,
      })),
    [],
  );

  useEffect(() => {
    const t = setTimeout(onDone, 1200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      key="step-celebration"
      className="relative flex min-h-[340px] flex-col items-center justify-center gap-6 overflow-hidden py-12 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      />

      <div className="pointer-events-none absolute inset-0">
        {particles.map((p) => {
          const rad = (p.angle * Math.PI) / 180;
          const tx = Math.cos(rad) * p.dist;
          const ty = Math.sin(rad) * p.dist + 20;
          return (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-[42%] block rounded-[2px]"
              style={{
                width: p.w,
                height: p.h,
                background: p.color,
                marginLeft: -p.w / 2,
                marginTop: -p.h / 2,
              }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                x: tx,
                y: ty,
                opacity: [0, 1, 1, 0],
                scale: [0, 1.1, 1, 0.4],
                rotate: p.rotate,
              }}
              transition={{
                duration: 0.85,
                delay: 0.08 + p.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          );
        })}
      </div>

      <motion.div
        className="relative flex h-[88px] w-[88px] items-center justify-center"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.05 }}
      >
        <svg className="absolute inset-0 h-[88px] w-[88px] -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="2" opacity="0.35" />
          <motion.circle
            cx="44"
            cy="44"
            r="40"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
        </svg>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.35 }}
        >
          <CheckCircle2 className="h-11 w-11 text-primary drop-shadow-[0_0_12px_hsl(var(--primary)/0.45)]" />
        </motion.div>
      </motion.div>

      <motion.div
        className="relative z-[1] max-w-md space-y-2 px-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="font-display text-2xl font-bold tracking-tight text-foreground md:text-[1.65rem]">
          {message}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
      </motion.div>

      <motion.div
        className="relative z-[1] inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Шаг {stepNum} из {total}
      </motion.div>
    </motion.div>
  );
}

/* ─── voice input hook ─────────────────────────────────────────────── */
function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef<EventTarget | null>(null);

  const toggle = useCallback(() => {
    const SR =
      (window as unknown as { SpeechRecognition?: new () => EventTarget }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: new () => EventTarget })
        .webkitSpeechRecognition;
    if (!SR) {
      toast.error("Ваш браузер не поддерживает голосовой ввод");
      return;
    }

    if (listening) {
      (recogRef.current as unknown as { stop: () => void } | null)?.stop();
      return;
    }

    const r = new SR() as unknown as {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      start: () => void;
      stop: () => void;
      onresult: ((ev: { results: SpeechRecognitionResultList }) => void) | null;
      onend: (() => void) | null;
      onerror: ((ev: { error: string }) => void) | null;
    };
    r.lang = "ru-RU";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (ev) => {
      const transcript = Array.from(ev.results)
        .map((res) => (res as SpeechRecognitionResult)[0].transcript)
        .join(" ");
      onResult(transcript);
    };
    r.onerror = (ev) => {
      if (ev.error !== "no-speech") toast.error(`Ошибка записи: ${ev.error}`);
      setListening(false);
    };
    r.onend = () => setListening(false);
    recogRef.current = r as unknown as EventTarget;
    r.start();
    setListening(true);
  }, [listening, onResult]);

  return { listening, toggle };
}

/* ─── document upload ──────────────────────────────────────────────── */
function BriefDocumentUpload({
  files,
  uploading,
  onAdd,
  onRemove,
}: {
  files: BriefPendingFile[];
  uploading?: boolean;
  onAdd: (fileList: FileList) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border/80 px-4 py-2.5 text-xs text-muted-foreground transition",
          uploading
            ? "opacity-60 pointer-events-none"
            : "hover:border-primary/40 hover:bg-muted/40 hover:text-foreground",
        )}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileUp className="h-3.5 w-3.5" />
        )}
        {uploading ? "Загрузка…" : "Прикрепить документ"}
        <input
          type="file"
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files?.length) onAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        PDF, Word, TXT, MD и другие — до {MAX_UPLOAD_BYTES / (1024 * 1024)} МБ. Текст попадёт в контекст AI после
        создания проекта.
      </p>
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate" title={item.file.name}>
                {item.file.name}
              </span>
              <span className="shrink-0 text-muted-foreground tabular-nums">
                {formatFileSize(item.file.size)}
              </span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                aria-label="Удалить файл"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function appendHintText(
  current: string,
  hint: string,
  inputType: BriefQuestion["inputType"],
): string {
  const trimmed = hint.trim();
  if (!trimmed) return current;
  const base = current.trim();
  if (!base) return trimmed;

  const existing =
    inputType === "textarea"
      ? base.split("\n").map((line) => line.trim())
      : [base];
  if (existing.includes(trimmed)) return current;

  if (inputType === "textarea") return `${base}\n${trimmed}`;
  if (inputType === "text") return `${base}. ${trimmed}`;
  return trimmed;
}

/* ─── AI hints panel ───────────────────────────────────────────────── */
function AiHintsPanel({
  hints,
  loading,
  error,
  currentValue,
  inputType,
  onSelect,
  onRetry,
}: {
  hints?: string[];
  loading?: boolean;
  error?: boolean;
  currentValue: string;
  inputType: BriefQuestion["inputType"];
  onSelect: (text: string) => void;
  onRetry?: () => void;
}) {
  if (!loading && !error && (!hints || hints.length === 0)) return null;

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 md:p-5">
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 text-sm text-muted-foreground"
          >
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
            AI подбирает варианты под ваш проект…
          </motion.div>
        )}
        {!loading && hints && hints.length > 0 && (
          <motion.div key="hints" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                AI · Нажмите, чтобы добавить
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {hints.map((hint, i) => {
                const short = hint.length > 120 ? `${hint.slice(0, 117).trimEnd()}…` : hint;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelect(appendHintText(currentValue, hint, inputType))}
                    title={hint}
                    className="rounded-xl border border-primary/30 bg-background/60 px-4 py-3 text-left text-sm leading-snug text-foreground transition hover:border-primary hover:bg-primary/10"
                  >
                    {short}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
        {error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2 text-sm"
          >
            <p className="text-muted-foreground">Не удалось загрузить AI-подсказки.</p>
            {onRetry && (
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Повторить
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── single question card ─────────────────────────────────────────── */
function QuestionCard({
  question,
  value,
  files,
  filesUploading,
  onChange,
  onAddFiles,
  onRemoveFile,
  dir,
  aiHintsEnabled,
  aiHint,
  aiHintLoading,
  aiHintError,
  onRetryHints,
}: {
  question: BriefQuestion;
  value: string;
  files: BriefPendingFile[];
  filesUploading?: boolean;
  onChange: (v: string) => void;
  onAddFiles: (fileList: FileList) => void;
  onRemoveFile: (id: string) => void;
  dir: 1 | -1;
  aiHintsEnabled?: boolean;
  aiHint?: string[];
  aiHintLoading?: boolean;
  aiHintError?: boolean;
  onRetryHints?: () => void;
}) {
  const { listening, toggle } = useVoiceInput((text) =>
    onChange(value ? `${value} ${text}` : text),
  );

  return (
    <motion.div key={question.id} {...slide(dir)} className="space-y-7">
      {/* Category badge */}
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
        <span>{question.categoryEmoji}</span>
        <span>{question.category}</span>
      </div>

      {/* Question */}
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-bold leading-snug md:text-3xl lg:text-[2rem]">
          {question.emoji} {question.title}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
          {question.subtitle}
        </p>
      </div>

      {/* Input */}
      {question.inputType === "choice" && question.choices ? (
        <div className="grid gap-2.5 sm:grid-cols-2 max-h-[42vh] overflow-y-auto pr-1">
          {question.choices.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                value === opt.value
                  ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.4)]"
                  : "border-border hover:border-primary/40 hover:bg-muted/50",
              )}
            >
              <p className="text-sm font-semibold">{opt.label}</p>
              {opt.hint && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{opt.hint}</p>
              )}
            </button>
          ))}
        </div>
      ) : question.inputType === "textarea" ? (
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="min-h-[160px] text-base md:text-[15px] pr-12 resize-none leading-relaxed"
            autoFocus
          />
          <button
            type="button"
            title={listening ? "Стоп" : "Говорить"}
            onClick={toggle}
            className={cn(
              "absolute bottom-3 right-3 rounded-lg p-2 transition-colors",
              listening
                ? "bg-destructive/20 text-destructive"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10",
            )}
          >
            {listening ? (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                <MicOff className="h-4 w-4" />
              </motion.div>
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
        </div>
      ) : question.inputType === "url" ? (
        <div className="flex items-center gap-2">
          <Input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="h-12 text-base"
            autoFocus
          />
          <button
            type="button"
            title={listening ? "Стоп" : "Продиктовать"}
            onClick={toggle}
            className={cn(
              "shrink-0 rounded-lg p-2.5 transition-colors border",
              listening ? "bg-destructive/10 border-destructive/40 text-destructive" : "border-border hover:border-primary/40 text-muted-foreground hover:text-primary",
            )}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            className="h-12 text-base"
            autoFocus
          />
          <button
            type="button"
            title={listening ? "Стоп" : "Продиктовать"}
            onClick={toggle}
            className={cn(
              "shrink-0 rounded-lg p-2.5 transition-colors border",
              listening ? "bg-destructive/10 border-destructive/40 text-destructive" : "border-border hover:border-primary/40 text-muted-foreground hover:text-primary",
            )}
          >
            {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        </div>
      )}

      {aiHintsEnabled && (
        <AiHintsPanel
          hints={aiHint}
          loading={aiHintLoading}
          error={aiHintError}
          currentValue={value}
          inputType={question.inputType}
          onSelect={onChange}
          onRetry={onRetryHints}
        />
      )}

      {/* Documents */}
      <BriefDocumentUpload
        files={files}
        uploading={filesUploading}
        onAdd={onAddFiles}
        onRemove={onRemoveFile}
      />
    </motion.div>
  );
}

/* ─── progress ring ────────────────────────────────────────────────── */
function ProgressRing({ step, total }: { step: number; total: number }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const pct = step / total;
  const dash = circ * pct;

  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <svg width="48" height="48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        <motion.circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute text-[11px] font-bold tabular-nums text-primary">
        {step}/{total}
      </span>
    </div>
  );
}

/* ─── main wizard ──────────────────────────────────────────────────── */
export function ProjectBriefWizard({ variant = "page", onComplete, onCancel }: Props) {
  const nav = useNavigate();
  const {
    aiHints,
    prefetchAfterFirstQuestion,
    prefetchForStep,
    retryField,
    getStatus,
    isLoading,
  } = useBriefHints();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<BriefAnswers>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, BriefPendingFile[]>>({});
  const [filesUploading, setFilesUploading] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);
  const [celebrating, setCelebrating] = useState(false);
  const [projectId, setProjectId] = useState<string | undefined>();

  const [building, setBuilding] = useState(false);
  const [buildStage, setBuildStage] = useState(0);
  const [guideProjectId, setGuideProjectId] = useState<string | null>(null);
  const [guideHasWebsite, setGuideHasWebsite] = useState(false);

  /* restore draft on mount */
  useEffect(() => {
    const draft = loadBriefDraft();
    if (draft && draft.answers && Object.keys(draft.answers).length > 0) {
      setAnswers(draft.answers);
      if (draft.currentStep < TOTAL) setCurrentStep(draft.currentStep);
      if (draft.projectId) setProjectId(draft.projectId);
      if (draft.answers.product_name?.trim() && draft.currentStep > 0) {
        prefetchAfterFirstQuestion(draft.answers);
        prefetchForStep(draft.currentStep, draft.answers);
      }
    }
  }, [prefetchAfterFirstQuestion, prefetchForStep]);

  /* auto-save on every change */
  useEffect(() => {
    saveBriefDraft({ startedAt: Date.now(), currentStep, answers, projectId });
  }, [currentStep, answers, projectId]);

  const question = BRIEF_QUESTIONS[currentStep];
  const aiHintsEnabled =
    currentStep > 0 &&
    Boolean(answers.product_name?.trim()) &&
    question != null &&
    questionAcceptsAiHints(question.inputType);

  useEffect(() => {
    if (!aiHintsEnabled) return;
    prefetchForStep(currentStep, answers);
  }, [currentStep, aiHintsEnabled, prefetchForStep]);

  if (!question) return null;

  const answer = answers[question.id] ?? "";
  const questionFiles = pendingFiles[question.id] ?? [];

  const setAnswer = (v: string) =>
    setAnswers((prev) => ({ ...prev, [question.id]: v }));

  const handleAddFiles = async (fileList: FileList) => {
    const picked = Array.from(fileList);
    const tooBig = picked.find((f) => f.size > MAX_UPLOAD_BYTES);
    if (tooBig) {
      toast.error(`${tooBig.name}: не больше ${MAX_UPLOAD_BYTES / (1024 * 1024)} МБ`);
      return;
    }

    if (projectId) {
      setFilesUploading(true);
      try {
        for (const file of picked) {
          await uploadProjectContextFile(projectId, file);
          toast.success(`Загружено: ${file.name}`);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Не удалось загрузить файл");
      } finally {
        setFilesUploading(false);
      }
      return;
    }

    const items: BriefPendingFile[] = picked.map((file) => ({
      id: crypto.randomUUID(),
      file,
    }));
    setPendingFiles((prev) => ({
      ...prev,
      [question.id]: [...(prev[question.id] ?? []), ...items],
    }));
  };

  const handleRemoveFile = (fileId: string) => {
    setPendingFiles((prev) => ({
      ...prev,
      [question.id]: (prev[question.id] ?? []).filter((f) => f.id !== fileId),
    }));
  };

  const canContinue =
    !question.required || answer.trim().length > 0;

  const handleNext = () => {
    if (!canContinue) {
      toast.error("Ответьте на вопрос, чтобы продолжить");
      return;
    }

    if (currentStep === TOTAL - 1) {
      void runFinish();
      return;
    }

    /* trigger celebration */
    setCelebrating(true);
  };

  const handleCelebrationDone = () => {
    setCelebrating(false);
    setDir(1);
    const nextStep = currentStep + 1;
    if (currentStep === 0) {
      prefetchAfterFirstQuestion({ ...answers, [question.id]: answer });
    }
    setCurrentStep(nextStep);
  };

  const handleBack = () => {
    if (currentStep === 0) {
      onCancel?.();
      return;
    }
    setDir(-1);
    setCurrentStep((s) => s - 1);
  };

  const runFinish = async () => {
    if (!canContinue) {
      toast.error("Ответьте на вопрос, чтобы завершить");
      return;
    }
    setBuilding(true);
    setBuildStage(0);

    try {
      /* create project from brief answers */
      const t1 = window.setTimeout(() => setBuildStage(1), 800);

      let pid = projectId;
      if (!pid) {
        const draft = {
          startupMode: "has_business" as const,
          productName: answers.product_name?.trim() || undefined,
          productDescription:
            answers.product_description ?? answers.product_name ?? "Мой проект",
          targetAudience: answers.target_audience ?? "",
          mainGoal: (answers.main_goal ?? "increase_conversion") as MainGoal,
          website: answers.website?.trim() || undefined,
        };
        const result = await completeQuizFromDraft(draft, { redirectTo: "project" });
        pid = result.projectId;
        setProjectId(pid);
        saveBriefDraft({ startedAt: Date.now(), currentStep: TOTAL, answers, projectId: pid });
      }

      window.clearTimeout(t1);
      setBuildStage(1);

      /* save all memory sections */
      const memoryPatch = mapBriefAnswersToMemory(answers);

      for (const [section, value] of Object.entries(memoryPatch) as [
        keyof ProjectMemorySections,
        ProjectMemorySections[keyof ProjectMemorySections],
      ][]) {
        if (value && typeof value === "object") {
          const filled = Object.values(value).some(
            (v) => typeof v === "string" && v.trim().length > 0,
          );
          if (filled) {
            await saveProjectMemorySection(pid, section, value).catch(() => null);
          }
        }
      }

      const queuedFiles = Object.values(pendingFiles).flat();
      if (queuedFiles.length > 0) {
        setBuildStage(2);
        for (const item of queuedFiles) {
          try {
            await uploadProjectContextFile(pid, item.file);
          } catch (e) {
            console.warn("brief file upload:", item.file.name, e);
          }
        }
      }

      setBuildStage(3);
      await new Promise((r) => setTimeout(r, 400));

      clearBriefDraft();

      setGuideHasWebsite(Boolean(answers.website?.trim()));
      setGuideProjectId(pid);
      setBuilding(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Что-то пошло не так");
      setBuilding(false);
    }
  };

  const isSheet = variant === "sheet";
  const widthClass = contentWidth(isSheet);

  function finishGuide(nextPath?: string) {
    if (!guideProjectId) return;
    if (onComplete) {
      onComplete(guideProjectId, nextPath);
      return;
    }
    nav(nextPath ?? `/projects/${guideProjectId}`, { replace: true });
  }

  if (guideProjectId) {
    return (
      <BriefCompletionGuide
        projectId={guideProjectId}
        hasWebsite={guideHasWebsite}
        variant={variant}
        onContinue={finishGuide}
      />
    );
  }

  if (building) {
    return (
      <div className={cn("flex flex-col", isSheet ? "min-h-0" : "min-h-0 flex-1")}>
        <div
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-8 py-12",
            !isSheet && `container mx-auto ${widthClass} px-6`,
          )}
        >
          <motion.div
            className="flex flex-col items-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
            </div>
            <div className="space-y-1 text-center">
              <h2 className="font-display text-xl font-bold">Собираем проект</h2>
              <p className="text-sm text-muted-foreground">Заполняем память AI из вашего брифа…</p>
            </div>
          </motion.div>
          <ul className="w-full max-w-xs space-y-3">
            {BUILD_STAGES.map((label, i) => {
              const state = i < buildStage ? "done" : i === buildStage ? "active" : "pending";
              return (
                <motion.li
                  key={label}
                  className="flex items-center gap-3 text-sm"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  {state === "done" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : state === "active" ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span className={state === "pending" ? "text-muted-foreground/50" : ""}>
                    {label}
                  </span>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", isSheet ? "" : "bg-muted/10")}>
      {/* header: progress */}
      <div
        className={cn(
          "shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-sm",
          isSheet ? "pb-4" : "py-6",
        )}
      >
        <div className={cn("mx-auto w-full px-6", widthClass)}>
          <div className="mb-4 flex items-center justify-between gap-6">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Бриф проекта
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentStep === 0
                  ? "Ответьте на вопросы — AI заполнит память проекта и ускорит все генерации"
                  : aiHintsEnabled
                    ? "AI подсказки активны — нажмите на вариант, чтобы добавить к ответу"
                    : "Вы на отличном пути — чем больше деталей, тем точнее результат"}
              </p>
            </div>
            <ProgressRing step={currentStep + 1} total={TOTAL} />
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full bg-gradient-money"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / TOTAL) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>

      {/* question area */}
      <div className="min-h-0 flex-1 overflow-y-auto py-8 md:py-10">
        <div className={cn("mx-auto w-full px-6", widthClass)}>
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card",
              isSheet ? "p-5" : "p-7 md:p-10",
            )}
          >
            <AnimatePresence mode="wait">
              {celebrating ? (
                <StepCelebration
                  key="celebrate"
                  message={question.celebration}
                  detail={question.celebrationDetail}
                  stepNum={currentStep + 1}
                  total={TOTAL}
                  onDone={handleCelebrationDone}
                />
              ) : (
                <div key={question.id} className="relative">
                  <QuestionCard
                    question={question}
                    value={answer}
                    files={questionFiles}
                    filesUploading={filesUploading}
                    onChange={setAnswer}
                    onAddFiles={handleAddFiles}
                    onRemoveFile={handleRemoveFile}
                    dir={dir}
                    aiHintsEnabled={aiHintsEnabled}
                    aiHint={aiHintsEnabled ? aiHints[question.id] : undefined}
                    aiHintLoading={aiHintsEnabled && isLoading(question.id)}
                    aiHintError={aiHintsEnabled && getStatus(question.id) === "error"}
                    onRetryHints={
                      aiHintsEnabled
                        ? () => retryField(answers, question.id)
                        : undefined
                    }
                  />

                  {!question.required && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="mt-4 text-center text-xs text-muted-foreground"
                    >
                      Необязательный вопрос — можно пропустить
                    </motion.p>
                  )}

                  <div className="mt-8 flex gap-3 border-t border-border/40 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-12 shrink-0"
                      onClick={handleBack}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      className="h-12 flex-1 bg-gradient-money text-primary-foreground font-semibold shadow-glow text-base"
                      onClick={handleNext}
                      disabled={question.required && !canContinue}
                    >
                      {currentStep === TOTAL - 1 ? (
                        <>
                          Создать проект
                          <CheckCircle2 className="ml-2 h-4 w-4" />
                        </>
                      ) : (
                        <>
                          {question.required && !answer.trim()
                            ? "Ответьте, чтобы продолжить"
                            : "Далее"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>

                  {!question.required && currentStep < TOTAL - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDir(1);
                        setCurrentStep((s) => s + 1);
                      }}
                      className="mt-4 block w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                    >
                      Пропустить этот вопрос →
                    </button>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
