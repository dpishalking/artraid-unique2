import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ScanSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HypothesesKanbanWidget } from "@/components/hypotheses/HypothesesKanbanWidget";
import { AuditHypothesesPlan } from "@/components/audit/AuditHypothesesPlan";
import { GrowthCycleStepNav } from "@/components/growthCycle/GrowthCycleStepNav";
import { GrowthCycleResultsPanel } from "@/components/growthCycle/GrowthCycleResultsPanel";
import { normalizeAudit } from "@/lib/normalizeAudit";
import type { Audit } from "@/components/AuditDashboard";
import { supabase } from "@/integrations/supabase/client";
import { toolHref } from "@/lib/navigation/productNav";
import type { GrowthCycleStep } from "@/lib/growthCycle/routes";
import { growthCycleHref } from "@/lib/growthCycle/routes";

type SharedPayload = {
  audit?: Audit;
  siteUrl?: string;
  error?: string;
};

type Props = {
  projectId: string;
  projectName?: string;
  domain?: string;
  hasAudit: boolean;
  reportShareId: string | null;
  step: GrowthCycleStep;
  onStepChange: (step: GrowthCycleStep) => void;
};

export function GrowthCycleView({
  projectId,
  projectName,
  domain,
  hasAudit,
  reportShareId,
  step,
  onStepChange,
}: Props) {
  const [audit, setAudit] = useState<Audit | null>(null);
  const [siteUrl, setSiteUrl] = useState<string | undefined>();
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);

  useEffect(() => {
    if (!reportShareId) {
      setAudit(null);
      setSiteUrl(undefined);
      return;
    }

    let cancelled = false;
    setLoadingAudit(true);
    setAuditError(null);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke<SharedPayload>("get-shared-report", {
          body: { id: reportShareId },
        });
        if (cancelled) return;
        if (error || data?.error || !data?.audit) {
          setAudit(null);
          setAuditError(error?.message ?? data?.error ?? "Не удалось загрузить последний аудит");
          return;
        }
        setAudit(normalizeAudit(data.audit));
        setSiteUrl(data.siteUrl);
      } catch (e) {
        if (!cancelled) {
          setAudit(null);
          setAuditError(e instanceof Error ? e.message : "Ошибка загрузки аудита");
        }
      } finally {
        if (!cancelled) setLoadingAudit(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reportShareId]);

  useEffect(() => {
    listHypothesesForProject(projectId)
      .then((rows) => {
        setActiveCount(
          rows.filter((h) => ["selected", "in_progress"].includes(h.status)).length,
        );
        setResultsCount(
          rows.filter((h) => ["implemented", "won", "rejected"].includes(h.status)).length,
        );
      })
      .catch(() => {});
  }, [projectId, step]);

  const hypotheses = audit?.hypotheses ?? [];
  const auditHref = toolHref("/audit", projectId);
  const reportHref = reportShareId ? `/r/${reportShareId}` : null;

  const completedThrough = useMemo((): GrowthCycleStep | undefined => {
    if (resultsCount > 0) return "results";
    if (activeCount > 0) return "implement";
    if (hasAudit && hypotheses.length > 0) return "hypotheses";
    if (hasAudit) return "audit";
    return undefined;
  }, [activeCount, hasAudit, hypotheses.length, resultsCount]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-6 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-money">
          Отдельная воронка
        </p>
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Цикл внедрения
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          {projectName ? (
            <>
              Проект «{projectName}»: аудит → 10 гипотез → канбан → результат. Не смешиваем с
              обзором проекта и свободной лабораторией.
            </>
          ) : (
            <>Аудит → 10 гипотез → канбан → результат — линейный контур внедрения правок.</>
          )}
        </p>
      </header>

      <GrowthCycleStepNav active={step} onChange={onStepChange} completedThrough={completedThrough} />

      {step === "audit" && (
        <section className="space-y-4">
          {!hasAudit && (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/30 p-6 md:p-8 space-y-4">
              <div className="flex items-start gap-3">
                <ScanSearch className="h-5 w-5 shrink-0 text-money mt-0.5" />
                <div>
                  <p className="font-display text-lg font-semibold">Сначала — аудит сайта</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    AI разберёт упаковку и сформирует 10 SMART-гипотез для внедрения. Без аудита
                    воронка начнётся с пустого списка.
                  </p>
                </div>
              </div>
              <Button asChild className="bg-gradient-money text-primary-foreground">
                <Link to={auditHref}>
                  Запустить аудит
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}

          {hasAudit && (
            <div className="rounded-2xl border border-money/25 bg-money/[0.04] p-6 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-money mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-semibold">Аудит готов</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {domain ? `Разобран сайт ${domain}.` : "Последний разбор сохранён в проект."}{" "}
                    Переходите к гипотезам или откройте полный отчёт.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="bg-gradient-money text-primary-foreground"
                  onClick={() => onStepChange("hypotheses")}
                >
                  К гипотезам
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {reportHref && (
                  <Button variant="outline" asChild>
                    <Link to={reportHref} target="_blank" rel="noopener noreferrer">
                      Полный отчёт
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
                <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
                  <Link to={auditHref}>Новый аудит</Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === "hypotheses" && (
        <section className="space-y-4">
          {!hasAudit && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border/60 bg-card/30 px-4 py-5 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-muted-foreground">
                Сначала запустите аудит — тогда здесь появятся 10 гипотез.
              </span>
              <Button asChild size="sm" onClick={() => onStepChange("audit")}>
                <Link to={auditHref}>К аудиту</Link>
              </Button>
            </div>
          )}

          {hasAudit && loadingAudit && (
            <div className="flex items-center justify-center rounded-xl border border-border/50 py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загружаем гипотезы из аудита…
            </div>
          )}

          {hasAudit && !loadingAudit && auditError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {auditError}
            </div>
          )}

          {hasAudit && !loadingAudit && !auditError && hypotheses.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                Нажмите «Взять в работу» — карточка попадёт в канбан на следующем шаге.
              </p>
              <AuditHypothesesPlan
                hypotheses={hypotheses}
                projectId={projectId}
                siteUrl={siteUrl}
              />
              {activeCount > 0 && (
                <div className="flex justify-end pt-2">
                  <Button variant="outline" onClick={() => onStepChange("implement")}>
                    К канбану ({activeCount})
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}

          {hasAudit && !loadingAudit && !auditError && hypotheses.length === 0 && (
            <div className="rounded-xl border border-border/50 bg-card/30 px-4 py-5 text-sm text-muted-foreground">
              В последнем аудите нет готовых гипотез —{" "}
              <Link to={auditHref} className="text-primary hover:underline">
                запустите новый разбор
              </Link>
              .
            </div>
          )}
        </section>
      )}

      {step === "implement" && (
        <section>
          <HypothesesKanbanWidget projectId={projectId} domain={domain} />
        </section>
      )}

      {step === "results" && <GrowthCycleResultsPanel projectId={projectId} />}
    </div>
  );
}
