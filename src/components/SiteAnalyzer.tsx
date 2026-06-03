import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import {
  Loader2,
  Search,
  ArrowRight,
  CheckCircle2,
  Circle,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { normalizeAudit } from "@/lib/normalizeAudit";
import { AuditDashboard, type Audit } from "./AuditDashboard";
import { AuditReportErrorBoundary } from "./AuditReportErrorBoundary";
import { AuditMaterialsPicker } from "./audit/AuditMaterialsPicker";
import { cn } from "@/lib/utils";

const urlSchema = z
  .string()
  .trim()
  .min(4, "Введи адрес сайта")
  .max(500, "Слишком длинный URL")
  .transform((v) => (v.startsWith("http") ? v : `https://${v}`))
  .refine((v) => {
    try { new URL(v); return true; } catch { return false; }
  }, "Некорректный URL");

const STAGES = [
  "Изучаем первый экран",
  "Проверяем оффер",
  "Ищем слабые формулировки",
  "Смотрим, где теряется доверие",
  "Оцениваем путь к заявке",
  "Собираем диагностическую карту",
];

const TICKER = [
  "Ищем смысловые провалы…",
  "Проверяем, где клиент может уйти…",
  "Собираем карту проблем…",
  "Формируем рекомендации…",
];

type SiteAnalyzerProps = {
  projectId?: string;
  defaultUrl?: string;
  onAuditChange?: (hasAudit: boolean) => void;
  /** false — режим только аудита без баннеров перехода в проект после сохранения */
  showProjectIntegrations?: boolean;
};

export function SiteAnalyzer({
  projectId,
  defaultUrl,
  onAuditChange,
  showProjectIntegrations = true,
}: SiteAnalyzerProps = {}) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [audit, setAudit] = useState<Audit | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "checking" | "ready" | "analyzing">("idle");
  const [stageIdx, setStageIdx] = useState(0);
  const [tickerIdx, setTickerIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const stageTimer = useRef<number | null>(null);
  const tickerTimer = useRef<number | null>(null);
  const progressTimer = useRef<number | null>(null);

  useEffect(() => {
    if (defaultUrl) setUrl(defaultUrl);
  }, [defaultUrl]);

  const reset = () => {
    setAudit(null);
    setUrl(defaultUrl ?? "");
    setShareId(null);
    onAuditChange?.(false);
  };

  useEffect(() => {
    if (!loading) {
      setStageIdx(0);
      setTickerIdx(0);
      setProgress(0);
      if (stageTimer.current) window.clearInterval(stageTimer.current);
      if (tickerTimer.current) window.clearInterval(tickerTimer.current);
      if (progressTimer.current) window.clearInterval(progressTimer.current);
      return;
    }
    stageTimer.current = window.setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
    }, 2200);
    tickerTimer.current = window.setInterval(() => {
      setTickerIdx((i) => (i + 1) % TICKER.length);
    }, 1800);
    progressTimer.current = window.setInterval(() => {
      setProgress((p) => (p < 92 ? p + Math.max(0.3, (92 - p) * 0.025) : p));
    }, 150);
    return () => {
      if (stageTimer.current) window.clearInterval(stageTimer.current);
      if (tickerTimer.current) window.clearInterval(tickerTimer.current);
      if (progressTimer.current) window.clearInterval(progressTimer.current);
    };
  }, [loading]);

  const handleRipple = (e: MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const span = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    span.className = "ripple";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - rect.left - size / 2}px`;
    span.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(span);
    window.setTimeout(() => span.remove(), 650);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = urlSchema.safeParse(url);
    if (!parsed.success) {
      toast.error("Похоже, ссылка указана неверно. Вставьте адрес сайта в формате example.com или https://example.com");
      return;
    }
    setLoading(true);
    setAudit(null);
    setPhase("checking");

    try {
      // 1. Server-side URL availability check
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();
      const bearer = session?.access_token ?? anonKey;

      const checkResp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
            apikey: anonKey,
          },
          body: JSON.stringify({ url: parsed.data }),
        },
      );
      const checkData = await checkResp.json().catch(() => ({}));
      if (!checkResp.ok || !checkData?.ok) {
        if (checkData?.code === "invalid_url") {
          toast.error("Похоже, ссылка указана неверно. Вставьте адрес сайта в формате example.com или https://example.com");
        } else {
          toast.error("Не удалось открыть сайт. Проверьте ссылку или попробуйте другую страницу.");
        }
        setPhase("idle");
        return;
      }

      const finalUrl: string = checkData.final_url || parsed.data;
      setPhase("ready");
      toast.success("Сайт доступен. Запускаем анализ…");
      setPhase("analyzing");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-site`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bearer}`,
            apikey: anonKey,
          },
          body: JSON.stringify({
            url: finalUrl,
            original_url: parsed.data,
            ...(projectId ? { project_id: projectId } : {}),
          }),
        },
      );

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const apiMsg = typeof data?.message === "string" ? data.message : "";
        const apiErr = typeof data?.error === "string" ? data.error : "";
        if (resp.status === 429) {
          toast.error(apiMsg || apiErr || "Слишком много запросов. Попробуйте позже.");
        } else if (resp.status === 503) {
          toast.error(apiErr || "Сервис AI временно недоступен. Попробуйте через минуту.");
        } else if (resp.status === 413) {
          toast.error(
            apiErr ||
              "Страница слишком тяжёлая для разбора. Попробуйте главную страницу сайта или более короткий URL.",
          );
        } else if (resp.status === 422) {
          toast.error(
            apiErr ||
              "Модель не может разобрать этот URL. Попробуйте другую страницу или главную сайта.",
          );
        } else if (resp.status === 402) {
          toast.error("Закончились AI-кредиты.");
        } else {
          toast.error(apiErr || "Ошибка анализа");
        }
        return;
      }
      if (!data.audit) {
        toast.error("AI не вернул разбор. Попробуй ещё раз.");
        return;
      }
      setProgress(100);
      setAudit(normalizeAudit(data.audit));
      setShareId(data.shareId ?? null);
      onAuditChange?.(true);
    } catch (err) {
      console.error(err);
      toast.error("Не удалось выполнить анализ");
    } finally {
      setLoading(false);
      setPhase("idle");
    }
  };

  return (
    <div className="space-y-6">
      {!audit && (
        <>
          <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-stretch">
            <div className="animated-border flex-1">
              <div className="relative rounded-[14px] bg-card/90 backdrop-blur">
                <span className="pointer-events-none absolute left-4 top-1/2 hidden h-2 w-2 -translate-y-1/2 rounded-full bg-money pulse-hint sm:block" />
                <Input
                  type="text"
                  placeholder="вставьте ваш сайт сюда"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  className="h-14 w-full rounded-[14px] border-0 bg-transparent px-5 text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 sm:pl-9"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              onMouseDown={handleRipple}
              data-event="analysis-start"
              className="group btn-press relative h-14 overflow-hidden rounded-xl bg-gradient-money px-7 text-base font-semibold text-primary-foreground shadow-glow transition-all hover:scale-[1.02] hover:shadow-[0_25px_70px_-15px_hsl(var(--primary)/0.6)]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {phase === "checking" ? "Проверяем ссылку…" : phase === "ready" ? "Сайт доступен…" : "Анализирую…"}
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Проверьте сайт
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {!loading && (
            <p className="-mt-2 text-center text-sm text-muted-foreground">
              {"\n"}
            </p>
          )}

          {projectId && showProjectIntegrations && !loading && (
            <AuditMaterialsPicker projectId={projectId} />
          )}
        </>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="audit-scene"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border bg-card/70 p-6 shadow-card backdrop-blur md:p-8"
          >
            <div className="grid-noise pointer-events-none absolute inset-0 opacity-40" />
            <div className="scan-line" />

            <div className="relative">
              <div className="mb-5 flex items-center gap-3">
                <div className="rounded-lg bg-primary/15 p-2 text-primary">
                  <ScanLine className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="font-display text-lg font-semibold">
                    Сканируем смыслы страницы…
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tickerIdx}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm text-muted-foreground"
                    >
                      {TICKER[tickerIdx]}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              <ul className="space-y-2.5">
                {STAGES.map((s, i) => {
                  const state = i < stageIdx ? "done" : i === stageIdx ? "active" : "pending";
                  return (
                    <motion.li
                      key={s}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-3 text-sm"
                    >
                      {state === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-money" />
                      ) : state === "active" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40" />
                      )}
                      <span
                        className={
                          state === "pending"
                            ? "text-muted-foreground/60"
                            : state === "active"
                              ? "text-foreground"
                              : "text-muted-foreground line-through decoration-money/40"
                        }
                      >
                        {s}
                      </span>
                    </motion.li>
                  );
                })}
              </ul>

              <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full bg-gradient-money"
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {audit && !loading && (
        <motion.div className="relative mx-auto mt-8 w-full max-w-[1680px] space-y-4">
          {projectId && shareId && showProjectIntegrations && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mx-auto flex flex-col justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-sm sm:flex-row sm:items-center",
                "max-w-7xl",
              )}
            >
              <span>Аудит сохранён в проект — инсайты и гипотезы обновлены.</span>
              <Button variant="secondary" size="sm" asChild>
                <Link to={`/projects/${projectId}`}>Вернуться в проект</Link>
              </Button>
            </motion.div>
          )}
          <AuditReportErrorBoundary onReset={reset}>
            <AuditDashboard audit={audit} onReset={reset} siteUrl={url} shareId={shareId} projectId={projectId} />
          </AuditReportErrorBoundary>
        </motion.div>
      )}
    </div>
  );
}
