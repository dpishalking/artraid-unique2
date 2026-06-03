import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Loader2,
  Plus,
  Sparkles,
  Wand2,
  Trash2,
  Archive,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Map,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  addManualCompetitor,
  analyzeCompetitor,
  archiveCompetitor,
  acknowledgeCompetitorAlert,
  listCompetitorAlerts,
  listCompetitors,
  removeCompetitor,
} from "@/lib/competitors/api";
import type {
  CompetitorChangeAlert,
  CompetitorProfile,
  CompetitorSource,
  CompetitorStatus,
} from "@/lib/competitors/types";
import { CompetitorDiscoveryDialog } from "@/components/competitors/CompetitorDiscoveryDialog";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import {
  COMPETITOR_FREE_LIMIT,
  isOverCompetitorLimit,
  remainingCompetitorSlots,
} from "@/lib/competitors/limits";

const SOURCE_LABELS: Record<CompetitorSource, string> = {
  manual: "Вручную",
  auto_context: "По контексту",
  auto_lookalike: "Похожие",
  auto_serp: "Из поиска",
  auto_extracted: "Из аудита",
};

const STATUS_LABELS: Record<CompetitorStatus, { label: string; tone: "default" | "secondary" | "outline" | "destructive" }> = {
  queued: { label: "В очереди", tone: "outline" },
  analyzing: { label: "Анализирую", tone: "secondary" },
  analyzed: { label: "Готово", tone: "default" },
  failed: { label: "Ошибка", tone: "destructive" },
  archived: { label: "В архиве", tone: "outline" },
};

export default function ProjectCompetitorsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { isAdmin } = useAdminAccess();
  const [rows, setRows] = useState<CompetitorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<CompetitorChangeAlert[]>([]);

  const reload = useCallback(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    listCompetitors(projectId)
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : "Не удалось загрузить конкурентов"))
      .finally(() => setLoading(false));
    listCompetitorAlerts(projectId)
      .then(setAlerts)
      .catch(() => setAlerts([]));
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const activeRows = useMemo(
    () => rows.filter((r) => r.status !== "archived"),
    [rows],
  );
  const analyzedCount = useMemo(
    () => activeRows.filter((r) => r.status === "analyzed").length,
    [activeRows],
  );
  const overLimit = isOverCompetitorLimit(activeRows.length, isAdmin);
  const remainingSlots = remainingCompetitorSlots(activeRows.length, isAdmin);

  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !manualUrl.trim() || adding) return;
    setAdding(true);
    try {
      const { profile, created } = await addManualCompetitor(projectId, manualUrl);
      if (created) {
        toast.success(`Добавлен: ${profile.host}`);
      } else {
        toast.info(`${profile.host} уже в списке`);
      }
      setManualUrl("");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось добавить");
    } finally {
      setAdding(false);
    }
  };

  const handleAnalyze = async (competitorId: string) => {
    setAnalyzingIds((prev) => new Set(prev).add(competitorId));
    setRows((prev) =>
      prev.map((r) => (r.id === competitorId ? { ...r, status: "analyzing" } : r)),
    );
    try {
      await analyzeCompetitor(competitorId);
      toast.success("Конкурент проанализирован");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Анализ не удался");
      reload();
    } finally {
      setAnalyzingIds((prev) => {
        const next = new Set(prev);
        next.delete(competitorId);
        return next;
      });
    }
  };

  const handleArchive = async (competitorId: string) => {
    try {
      await archiveCompetitor(competitorId);
      toast.success("Перенесён в архив");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const handleRemove = async (competitorId: string) => {
    try {
      await removeCompetitor(competitorId);
      toast.success("Удалён");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  if (!projectId) {
    return (
      <div className="text-sm text-muted-foreground">Проект не определён.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Конкурентная разведка
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Добавьте конкурентов, и AI проведёт по ним аудит «вашими глазами». Дальше из них собирается карта
            ниши с готовыми стратегиями.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant={analyzedCount >= 1 ? "default" : "outline"}>
            <Link to={`/projects/${projectId}/competitors/compare`}>
              <Map className="h-4 w-4 mr-2" /> Карта ниши · разведка
            </Link>
          </Button>
          <Button onClick={() => setDiscoveryOpen(true)} disabled={overLimit}>
            <Sparkles className="h-4 w-4 mr-2" /> Найти автоматически
          </Button>
        </div>
      </div>

      {/* Change alerts */}
      {alerts.length > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-4 space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex flex-wrap items-start justify-between gap-2 text-sm">
                <p className="text-muted-foreground">{alert.message}</p>
                <div className="flex gap-2 shrink-0">
                  {alert.alert_type === "page_changed" && (
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/projects/${projectId}/competitors/compare`}>Карта ниши</Link>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      acknowledgeCompetitorAlert(alert.id)
                        .then(() => setAlerts((prev) => prev.filter((a) => a.id !== alert.id)))
                        .catch(() => toast.error("Не удалось скрыть"))
                    }
                  >
                    Скрыть
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Free-limit hint */}
      {!isAdmin && (
        <Card className={overLimit ? "border-amber-500/40 bg-amber-500/5" : undefined}>
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              {overLimit ? (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
              <span>
                На free-тарифе доступно {COMPETITOR_FREE_LIMIT} конкурентов на проект.
                {" "}
                <span className="font-medium">
                  Использовано {activeRows.length}/{COMPETITOR_FREE_LIMIT}.
                </span>
              </span>
            </div>
            {overLimit && (
              <Button asChild size="sm" variant="outline">
                <a href="/pricing">Поднять лимит</a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual add */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Добавить вручную
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddManual} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="url"
              placeholder="https://competitor-site.com"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              disabled={adding || overLimit}
              className="flex-1"
            />
            <Button type="submit" disabled={!manualUrl.trim() || adding || overLimit}>
              {adding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Добавить
            </Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            Можно вставить любую ссылку — система возьмёт корневой домен.
          </p>
        </CardContent>
      </Card>

      {/* List */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && activeRows.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center space-y-3">
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Пока нет конкурентов. Добавьте 2–3 ссылки или нажмите «Найти автоматически» — AI подберёт
              кандидатов по описанию проекта.
            </p>
            <Button onClick={() => setDiscoveryOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" /> Найти автоматически
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && activeRows.length > 0 && (
        <div className="space-y-3">
          {activeRows.map((row) => {
            const isAnalyzing =
              analyzingIds.has(row.id) || row.status === "analyzing";
            const statusInfo = STATUS_LABELS[row.status];

            return (
              <Card key={row.id} className="overflow-hidden">
                <CardContent className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold leading-tight">
                          {row.name ?? row.host}
                        </h3>
                        <Badge variant={statusInfo.tone}>{statusInfo.label}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_LABELS[row.source]}
                        </Badge>
                        {row.confidence != null && row.source !== "manual" && (
                          <Badge variant="outline" className="text-xs font-mono">
                            confidence {Math.round(row.confidence * 100)}%
                          </Badge>
                        )}
                      </div>
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {row.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {row.ai_reason && (
                        <p className="text-xs text-muted-foreground italic">
                          AI: {row.ai_reason}
                        </p>
                      )}
                      {row.failure_reason && row.status === "failed" && (
                        <p className="text-xs text-destructive">
                          {row.failure_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant={row.status === "analyzed" ? "outline" : "default"}
                        onClick={() => handleAnalyze(row.id)}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                            Анализ
                          </>
                        ) : row.status === "analyzed" ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                            Повторить
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                            Проанализировать
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArchive(row.id)}
                        title="В архив"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(row.id)}
                        title="Удалить"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CompetitorDiscoveryDialog
        open={discoveryOpen}
        projectId={projectId}
        existingHosts={rows.map((r) => r.host)}
        remainingSlots={remainingSlots}
        unlimited={isAdmin}
        onOpenChange={setDiscoveryOpen}
        onAdded={reload}
      />
    </div>
  );
}
