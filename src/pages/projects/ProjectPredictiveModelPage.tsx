import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Download, GitBranchPlus, ListChecks, Loader2, MessageSquarePlus, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addPredictiveComment,
  buildPredictiveSummary,
  createActionItemFromAlert,
  getPredictiveSnapshot,
  humanizePredictiveError,
  listActionItems,
  listMetricDependencies,
  listPredictiveAlerts,
  monthLabel,
  syncPredictiveAlerts,
  updateActionItemStatus,
  updatePredictiveAlertStatus,
  upsertMetricDependency,
  weekLabel,
  upsertPredictiveValue,
} from "@/lib/predictive/api";
import type {
  PredictiveActionItem,
  PredictiveAlert,
  PredictiveCell,
  PredictiveComment,
  PredictiveDashboardSummary,
  PredictiveMetricDependency,
  PredictiveModelSnapshot,
  PredictiveMetric,
  PredictivePeriod,
  PredictiveStatus,
} from "@/lib/predictive/types";
import * as XLSX from "xlsx";

const STATUS_STYLE: Record<PredictiveStatus, string> = {
  "status-green": "text-emerald-600",
  "status-yellow": "text-amber-600",
  "status-red": "text-red-600",
  "status-empty": "text-muted-foreground",
};

function formatNumber(v: number | null, digits = 0): string {
  if (v == null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(v);
}

function StatusBadge({ status }: { status: PredictiveStatus }) {
  const label =
    status === "status-green" ? "Зелёный" :
    status === "status-yellow" ? "Жёлтый" :
    status === "status-red" ? "Красный" : "—";
  return <span className={STATUS_STYLE[status]}>{label}</span>;
}

function formulaPreview(formulaHint: string, metrics: PredictiveMetric[]): string {
  if (!formulaHint) return "";
  let out = formulaHint;
  for (const m of metrics) {
    out = out.replaceAll(`[${m.id}]`, m.name);
  }
  return out;
}

type CellEditorProps = {
  cell: PredictiveCell;
  kind: "plan" | "fact";
  onSave: (next: number | null) => Promise<void>;
};

function CellEditor({ cell, kind, onSave }: CellEditorProps) {
  const [local, setLocal] = useState<string>(cell[kind] == null ? "" : String(cell[kind]));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocal(cell[kind] == null ? "" : String(cell[kind]));
  }, [cell, kind]);

  return (
    <div className="flex items-center gap-1 min-w-[140px]">
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="h-8"
        inputMode="decimal"
        placeholder="—"
      />
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            const trimmed = local.trim().replace(",", ".");
            const next = trimmed === "" ? null : Number(trimmed);
            if (next != null && Number.isNaN(next)) {
              toast.error("Введите число");
              return;
            }
            await onSave(next);
          } finally {
            setSaving(false);
          }
        }}
      >
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export default function ProjectPredictiveModelPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [snapshot, setSnapshot] = useState<PredictiveModelSnapshot | null>(null);
  const [summary, setSummary] = useState<PredictiveDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [year] = useState<number>(new Date().getFullYear());
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [selectedForComment, setSelectedForComment] = useState<{
    metricId: string;
    periodId: string;
    metricName: string;
    periodLabel: string;
  } | null>(null);
  const [commentText, setCommentText] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [responsible, setResponsible] = useState("");
  const [deadline, setDeadline] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [alerts, setAlerts] = useState<PredictiveAlert[]>([]);
  const [actionItems, setActionItems] = useState<PredictiveActionItem[]>([]);
  const [dependencies, setDependencies] = useState<PredictiveMetricDependency[]>([]);
  const [dependencyOpen, setDependencyOpen] = useState(false);
  const [depParent, setDepParent] = useState("");
  const [depChild, setDepChild] = useState("");
  const [depFormula, setDepFormula] = useState("");

  const reload = async () => {
    if (!projectId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const snap = await getPredictiveSnapshot(projectId, year);
      await syncPredictiveAlerts(snap).catch(() => undefined);
      setSnapshot(snap);
      setSummary(buildPredictiveSummary(snap));
      const [loadedAlerts, loadedActions, loadedDeps] = await Promise.all([
        listPredictiveAlerts(snap.model.id).catch(() => []),
        listActionItems(snap.model.id).catch(() => []),
        listMetricDependencies(snap.model.id).catch(() => []),
      ]);
      setAlerts(loadedAlerts);
      setActionItems(loadedActions);
      setDependencies(loadedDeps);
    } catch (e) {
      setLoadError(humanizePredictiveError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, year]);

  const months = useMemo(
    () => (snapshot?.periods ?? []).filter((p) => p.type === "month").sort((a, b) => a.sort_order - b.sort_order),
    [snapshot],
  );
  const weeksByParent = useMemo(() => {
    const map: Record<string, PredictivePeriod[]> = {};
    for (const p of snapshot?.periods ?? []) {
      if (p.type !== "week" || !p.parent_period_id) continue;
      if (!map[p.parent_period_id]) map[p.parent_period_id] = [];
      map[p.parent_period_id].push(p);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => a.sort_order - b.sort_order);
    }
    return map;
  }, [snapshot]);

  const visiblePeriods = useMemo(() => {
    const out: PredictivePeriod[] = [];
    for (const m of months) {
      out.push(m);
      if (expandedMonths[m.id]) {
        out.push(...(weeksByParent[m.id] ?? []));
      }
    }
    return out;
  }, [expandedMonths, months, weeksByParent]);

  const commentsByMetricPeriod = useMemo(() => {
    const map = new Map<string, PredictiveComment[]>();
    for (const c of snapshot?.comments ?? []) {
      if (!c.metric_id || !c.period_id) continue;
      const key = `${c.metric_id}:${c.period_id}`;
      map.set(key, [...(map.get(key) ?? []), c]);
    }
    return map;
  }, [snapshot?.comments]);

  const exportRows = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.rows.map((row) => {
      const base: Record<string, string | number> = {
        Категория: row.category.name,
        Метрика: row.metric.name,
        Владелец: row.metric.owner_name ?? "",
        Тип: row.metric.type,
      };
      for (const p of visiblePeriods) {
        const label = p.type === "week" ? weekLabel(p) : monthLabel(p);
        const cell = row.cells[p.id];
        base[`${label} План`] = cell.plan ?? "";
        base[`${label} Факт`] = cell.fact ?? "";
        base[`${label} %PtF`] = cell.ptf_percent == null ? "" : Number(cell.ptf_percent.toFixed(1));
        base[`${label} Forecast`] = cell.forecast ?? "";
        base[`${label} Status`] =
          cell.status === "status-green" ? "green" :
          cell.status === "status-yellow" ? "yellow" :
          cell.status === "status-red" ? "red" : "";
      }
      return base;
    });
  }, [snapshot, visiblePeriods]);

  const exportCsv = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `predictive-model-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportXlsx = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Predictive");
    XLSX.writeFile(wb, `predictive-model-${year}.xlsx`);
  };

  if (!projectId) {
    return <p className="text-sm text-muted-foreground">Проект не определён.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Предиктивная модель</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sprint 4: formula engine — формулы пересчитывают plan/fact/ptf по зависимым метрикам.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && loadError && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-3">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
            <p className="font-medium text-foreground">Модель ещё не настроена</p>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              {loadError}
            </p>
            <Button variant="outline" size="sm" onClick={() => void reload()}>
              Повторить
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Revenue Plan</CardTitle></CardHeader>
            <CardContent className="text-xl font-semibold">{formatNumber(summary.revenuePlan)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Revenue Fact</CardTitle></CardHeader>
            <CardContent className="text-xl font-semibold">{formatNumber(summary.revenueFact)}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">% Achievement</CardTitle></CardHeader>
            <CardContent className="text-xl font-semibold">{formatNumber(summary.achievementPercent, 1)}%</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Forecast vs Plan</CardTitle></CardHeader>
            <CardContent className="text-xl font-semibold">{formatNumber(summary.forecastVsPlan, 1)}%</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Traffic Light</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <span className="text-emerald-600">G: {summary.green}</span>{" · "}
              <span className="text-amber-600">Y: {summary.yellow}</span>{" · "}
              <span className="text-red-600">R: {summary.red}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && snapshot && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alerts / красные флажки
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {alerts.length === 0 && (
                <p className="text-sm text-muted-foreground">Активных alert нет.</p>
              )}
              {alerts.map((a) => (
                <div key={a.id} className="rounded-lg border border-border p-3 text-sm flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p>{a.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("ru-RU")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={a.status}
                      onValueChange={async (next) => {
                        await updatePredictiveAlertStatus(a.id, next as PredictiveAlert["status"]);
                        await reload();
                      }}
                    >
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Статус" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">open</SelectItem>
                        <SelectItem value="in_progress">in_progress</SelectItem>
                        <SelectItem value="resolved">resolved</SelectItem>
                        <SelectItem value="ignored">ignored</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await createActionItemFromAlert({
                          modelId: snapshot.model.id,
                          metricId: a.metric_id,
                          periodId: a.period_id,
                          task: `Разобрать alert: ${a.message}`,
                          reason: "Auto-created from predictive alert",
                        });
                        toast.success("Action item создан");
                        await reload();
                      }}
                    >
                      В задачу
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-primary" />
                Action items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {actionItems.length === 0 && (
                <p className="text-sm text-muted-foreground">Задач пока нет.</p>
              )}
              {actionItems.slice(0, 8).map((it) => (
                <div key={it.id} className="rounded-lg border border-border p-2 text-xs">
                  <p className="font-medium">{it.task}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Select
                      value={it.status}
                      onValueChange={async (next) => {
                        await updateActionItemStatus(it.id, next as PredictiveActionItem["status"]);
                        await reload();
                      }}
                    >
                      <SelectTrigger className="h-7 w-[128px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">open</SelectItem>
                        <SelectItem value="in_progress">in_progress</SelectItem>
                        <SelectItem value="done">done</SelectItem>
                        <SelectItem value="cancelled">cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">{it.deadline ?? "без дедлайна"}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && snapshot && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <GitBranchPlus className="h-4 w-4 text-primary" />
              Связи метрик (lag/lead tree light)
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setDependencyOpen(true)}>
              Добавить связь
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {dependencies.length === 0 && (
              <p className="text-sm text-muted-foreground">Связи еще не настроены.</p>
            )}
            {dependencies.map((d) => {
              const parent = snapshot.metrics.find((m) => m.id === d.parent_metric_id)?.name ?? d.parent_metric_id;
              const child = snapshot.metrics.find((m) => m.id === d.child_metric_id)?.name ?? d.child_metric_id;
              return (
                <div key={d.id} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{parent} ← {child}</p>
                  {d.formula_hint && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formulaPreview(d.formula_hint, snapshot.metrics)}
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {!loading && snapshot && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">
                {snapshot.model.name} · {snapshot.model.year}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={exportCsv}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  CSV
                </Button>
                <Button size="sm" variant="outline" onClick={exportXlsx}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  XLSX
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Кликните по месяцу, чтобы раскрыть недели. Комментарии добавляйте на красных/жёлтых отклонениях.
            </p>

            <div className="overflow-auto">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10 min-w-[180px]">Категория</TableHead>
                    <TableHead className="sticky left-[180px] bg-card z-10 min-w-[220px]">Метрика</TableHead>
                    <TableHead className="min-w-[140px]">Владелец</TableHead>
                    <TableHead className="min-w-[110px]">Тип</TableHead>
                    {visiblePeriods.map((p) => (
                      <TableHead key={p.id} className="text-center min-w-[440px]">
                        {p.type === "month" ? (
                          <button
                            type="button"
                            className="underline-offset-4 hover:underline text-sm font-medium"
                            onClick={() =>
                              setExpandedMonths((prev) => ({
                                ...prev,
                                [p.id]: !prev[p.id],
                              }))
                            }
                          >
                            {monthLabel(p)} {expandedMonths[p.id] ? "▾" : "▸"}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">{weekLabel(p)}</span>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-card z-10" />
                    <TableHead className="sticky left-[180px] bg-card z-10" />
                    <TableHead />
                    <TableHead />
                    {visiblePeriods.map((p) => (
                      <TableHead key={`${p.id}-sub`} className="p-0">
                        <div className="grid grid-cols-7 text-xs text-muted-foreground px-2 py-1">
                          <span>План</span>
                          <span>Факт</span>
                          <span>%PtF</span>
                          <span>Δ</span>
                          <span>Forecast</span>
                          <span>Status</span>
                          <span>Комм.</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.rows.map((row) => (
                    <TableRow key={row.metric.id}>
                      <TableCell className="sticky left-0 bg-card z-10">{row.category.name}</TableCell>
                      <TableCell className="sticky left-[180px] bg-card z-10 font-medium">{row.metric.name}</TableCell>
                      <TableCell>{row.metric.owner_name ?? "—"}</TableCell>
                      <TableCell>
                        <div className="text-xs">
                          <div>{row.metric.type}</div>
                          {row.metric.calculation_type === "formula" && (
                            <div className="text-primary">formula</div>
                          )}
                        </div>
                      </TableCell>
                      {visiblePeriods.map((p) => {
                        const cell = row.cells[p.id];
                        const key = `${row.metric.id}:${p.id}`;
                        const comments = commentsByMetricPeriod.get(key) ?? [];
                        const latest = comments[0];
                        return (
                          <TableCell key={key} className="p-1">
                            <div className="grid grid-cols-7 items-center gap-1">
                              <CellEditor
                                cell={cell}
                                kind="plan"
                                onSave={async (next) => {
                                  await upsertPredictiveValue({
                                    modelId: snapshot.model.id,
                                    metricId: row.metric.id,
                                    periodId: p.id,
                                    kind: "plan",
                                    value: next,
                                  });
                                  await reload();
                                }}
                              />
                              {row.metric.calculation_type === "formula" ? (
                                <div className="text-xs text-muted-foreground px-2">auto</div>
                              ) : (
                                <CellEditor
                                  cell={cell}
                                  kind="fact"
                                  onSave={async (next) => {
                                    await upsertPredictiveValue({
                                      modelId: snapshot.model.id,
                                      metricId: row.metric.id,
                                      periodId: p.id,
                                      kind: "fact",
                                      value: next,
                                    });
                                    await reload();
                                  }}
                                />
                              )}
                              <div className="text-xs">{formatNumber(cell.ptf_percent, 1)}{cell.ptf_percent != null ? "%" : ""}</div>
                              <div className="text-xs">{formatNumber(cell.deviation, 1)}</div>
                              <div className="text-xs">{formatNumber(cell.forecast, 1)}</div>
                              <div className="text-xs"><StatusBadge status={cell.status} /></div>
                              <div className="text-xs">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  title={latest ? "Есть комментарий" : "Добавить комментарий"}
                                  onClick={() => {
                                    setSelectedForComment({
                                      metricId: row.metric.id,
                                      periodId: p.id,
                                      metricName: row.metric.name,
                                      periodLabel: p.type === "week" ? weekLabel(p) : monthLabel(p),
                                    });
                                    setCommentText(latest?.comment ?? "");
                                    setRootCause(latest?.root_cause ?? "");
                                    setActionPlan(latest?.action_plan ?? "");
                                    setResponsible(latest?.responsible ?? "");
                                    setDeadline(latest?.deadline ?? "");
                                  }}
                                >
                                  <MessageSquarePlus className={`h-3.5 w-3.5 ${latest ? "text-primary" : "text-muted-foreground"}`} />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedForComment && (
              <Card className="border-dashed">
                <CardHeader>
                  <CardTitle className="text-sm">
                    Комментарий к отклонению · {selectedForComment.metricName} · {selectedForComment.periodLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Комментарий"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <Input
                    placeholder="Причина (root cause)"
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                  />
                  <Input
                    placeholder="План действий"
                    value={actionPlan}
                    onChange={(e) => setActionPlan(e.target.value)}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      placeholder="Ответственный"
                      value={responsible}
                      onChange={(e) => setResponsible(e.target.value)}
                    />
                    <Input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      disabled={savingComment || commentText.trim().length === 0}
                      onClick={async () => {
                        if (!snapshot || !selectedForComment) return;
                        setSavingComment(true);
                        try {
                          await addPredictiveComment({
                            modelId: snapshot.model.id,
                            metricId: selectedForComment.metricId,
                            periodId: selectedForComment.periodId,
                            comment: commentText.trim(),
                            rootCause: rootCause.trim(),
                            actionPlan: actionPlan.trim(),
                            responsible: responsible.trim(),
                            deadline: deadline || undefined,
                          });
                          toast.success("Комментарий сохранён");
                          await reload();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Не удалось сохранить комментарий");
                        } finally {
                          setSavingComment(false);
                        }
                      }}
                    >
                      {savingComment && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Сохранить комментарий
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedForComment(null)}
                    >
                      Закрыть
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dependencyOpen} onOpenChange={setDependencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить связь метрик</DialogTitle>
            <DialogDescription>
              Выберите parent и child метрику, чтобы собрать дерево влияния.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={depParent} onValueChange={setDepParent}>
              <SelectTrigger><SelectValue placeholder="Parent metric" /></SelectTrigger>
              <SelectContent>
                {snapshot?.metrics.map((m) => (
                  <SelectItem key={`p-${m.id}`} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={depChild} onValueChange={setDepChild}>
              <SelectTrigger><SelectValue placeholder="Child metric" /></SelectTrigger>
              <SelectContent>
                {snapshot?.metrics.map((m) => (
                  <SelectItem key={`c-${m.id}`} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Формула (пример: [uuid_сделок] * [uuid_среднего_чека])"
              value={depFormula}
              onChange={(e) => setDepFormula(e.target.value)}
            />
            <div className="rounded-md border border-border p-2 text-xs text-muted-foreground">
              После сохранения parent-метрика автоматически станет <code>formula</code> и будет
              считаться из зависимостей по каждому периоду.
            </div>
            <div className="max-h-28 overflow-auto rounded-md border border-border p-2 text-xs">
              {snapshot?.metrics.map((m) => (
                <div key={m.id} className="flex justify-between gap-2 py-0.5">
                  <span className="text-muted-foreground">{m.name}</span>
                  <code>[{m.id}]</code>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={async () => {
                if (!snapshot || !depParent || !depChild || depParent === depChild) {
                  toast.error("Выберите разные метрики");
                  return;
                }
                await upsertMetricDependency({
                  modelId: snapshot.model.id,
                  parentMetricId: depParent,
                  childMetricId: depChild,
                  formulaHint: depFormula.trim(),
                });
                toast.success("Связь сохранена");
                setDependencyOpen(false);
                setDepParent("");
                setDepChild("");
                setDepFormula("");
                await reload();
              }}
            >
              Сохранить связь
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
