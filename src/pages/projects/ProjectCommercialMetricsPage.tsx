import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  EyeOff,
  FlaskConical,
  Loader2,
  Plus,
  Star,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  createCustomCommercialMetric,
  getCommercialMetricsSnapshot,
  humanizeCommercialError,
  listHypothesesForMetric,
  upsertCommercialMetric,
} from "@/lib/commercial/api";
import {
  COMMERCIAL_CATEGORY_LABELS,
  COMMERCIAL_DIRECTION_LABELS,
  type CommercialMetric,
  type CommercialMetricCategory,
} from "@/lib/commercial/types";
import { calculateMetricStatus } from "@/lib/commercial/status";
import { CommercialMetricEditDialog } from "@/components/commercial/CommercialMetricEditDialog";
import { formatMetricValue, TrafficLight } from "@/components/commercial/shared";

const ALL_CATEGORIES = Object.keys(COMMERCIAL_CATEGORY_LABELS) as CommercialMetricCategory[];

export default function ProjectCommercialMetricsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<CommercialMetric[]>([]);
  const [hypothesesByMetricId, setHypothesesByMetricId] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editTarget, setEditTarget] = useState<CommercialMetric | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<CommercialMetricCategory>("funnel");
  const [hypoPreview, setHypoPreview] = useState<CommercialMetric | null>(null);
  const [linkedHypos, setLinkedHypos] = useState<Array<{ id: string; title: string; status: string }>>([]);

  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const snap = await getCommercialMetricsSnapshot(projectId);
      setMetrics(snap.metrics.filter((m) => !m.is_hidden));
      setHypothesesByMetricId(snap.hypothesesByMetricId);
    } catch (e) {
      toast.error(humanizeCommercialError(e));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const enriched = useMemo(
    () =>
      metrics.map((m) => ({
        ...m,
        status: calculateMetricStatus(m),
      })),
    [metrics],
  );

  const filtered = useMemo(() => {
    return enriched.filter((m) => {
      if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      return true;
    });
  }, [enriched, categoryFilter, statusFilter]);

  const atRisk = useMemo(
    () => enriched.filter((m) => m.status === "red" || m.status === "yellow"),
    [enriched],
  );

  const growthLevers = useMemo(
    () =>
      enriched.filter(
        (m) => m.is_primary && (m.status === "green" || m.plan_value != null),
      ),
    [enriched],
  );

  const categoryCounts = useMemo(() => {
    const map = new Map<CommercialMetricCategory, number>();
    for (const c of ALL_CATEGORIES) map.set(c, 0);
    for (const m of enriched) map.set(m.category, (map.get(m.category) ?? 0) + 1);
    return map;
  }, [enriched]);

  const handleTogglePrimary = async (metric: CommercialMetric) => {
    try {
      await upsertCommercialMetric(metric.id, { is_primary: !metric.is_primary });
      await reload();
    } catch (e) {
      toast.error(humanizeCommercialError(e));
    }
  };

  const handleHide = async (metric: CommercialMetric) => {
    try {
      await upsertCommercialMetric(metric.id, { is_hidden: true });
      toast.success(`«${metric.name}» скрыта`);
      await reload();
    } catch (e) {
      toast.error(humanizeCommercialError(e));
    }
  };

  const handleAddCustom = async () => {
    if (!projectId || !newName.trim()) return;
    try {
      await createCustomCommercialMetric({
        projectId,
        name: newName.trim(),
        category: newCategory,
      });
      setShowAdd(false);
      setNewName("");
      toast.success("Метрика добавлена");
      await reload();
    } catch (e) {
      toast.error(humanizeCommercialError(e));
    }
  };

  const openHypotheses = (metric: CommercialMetric) => {
    setHypoPreview(metric);
    listHypothesesForMetric(metric.id)
      .then((rows) => setLinkedHypos(rows as typeof linkedHypos))
      .catch(() => setLinkedHypos([]));
  };

  const createHypothesis = (metric: CommercialMetric) => {
    navigate(
      `/projects/${projectId}/hypothesis-lab/generate?metricId=${metric.id}`,
    );
  };

  if (!projectId) {
    return <p className="text-sm text-muted-foreground">Проект не определён.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Коммерческие метрики проекта
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl mt-1">
          План и факт по ключевым показателям. Метрика → причина → гипотеза → эксперимент → результат.
          Данные доступны для план-факта, предиктивной модели и лаборатории гипотез.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-red-500/30 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Метрики в зоне риска
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {atRisk.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Критичных отклонений нет.</p>
                ) : (
                  atRisk.slice(0, 5).map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>{m.name}</span>
                      <div className="flex items-center gap-2">
                        <TrafficLight status={m.status} />
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => createHypothesis(m)}>
                          Гипотеза
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Главные рычаги роста
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {growthLevers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Отметьте ⭐ главные метрики в таблице ниже.
                  </p>
                ) : (
                  growthLevers.slice(0, 6).map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {m.name}
                      </span>
                      <TrafficLight status={m.status} />
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px] h-9"><SelectValue placeholder="Категория" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{COMMERCIAL_CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Статус" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="green">Зелёный</SelectItem>
                <SelectItem value="yellow">Жёлтый</SelectItem>
                <SelectItem value="red">Красный</SelectItem>
                <SelectItem value="empty">Без данных</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-1" /> Своя метрика
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-xl border p-4 text-left transition-colors hover:bg-muted/40 ${
                  categoryFilter === cat ? "border-primary bg-primary/5" : ""
                }`}
              >
                <p className="text-xs text-muted-foreground">{COMMERCIAL_CATEGORY_LABELS[cat]}</p>
                <p className="text-2xl font-semibold mt-1">{categoryCounts.get(cat) ?? 0}</p>
              </button>
            ))}
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Метрика</TableHead>
                    <TableHead>План</TableHead>
                    <TableHead>Факт</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Владелец</TableHead>
                    <TableHead>Гипотезы</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {m.is_primary && (
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                            )}
                            <span className="font-medium">{m.name}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {COMMERCIAL_CATEGORY_LABELS[m.category]}
                            {" · "}
                            {COMMERCIAL_DIRECTION_LABELS[m.direction]}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatMetricValue(m.plan_value, m.unit)}</TableCell>
                      <TableCell>{formatMetricValue(m.fact_value, m.unit)}</TableCell>
                      <TableCell><TrafficLight status={m.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.owner_name ?? "—"}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline"
                          onClick={() => openHypotheses(m)}
                        >
                          {hypothesesByMetricId[m.id] ?? 0}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditTarget(m)}>Изм.</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleTogglePrimary(m)} title="Главная">
                            <Star className={`h-3.5 w-3.5 ${m.is_primary ? "fill-amber-500 text-amber-500" : ""}`} />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => createHypothesis(m)}>
                            <FlaskConical className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleHide(m)}>
                            <EyeOff className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <CommercialMetricEditDialog
        metric={editTarget}
        open={Boolean(editTarget)}
        onOpenChange={(o) => !o && setEditTarget(null)}
        onSaved={() => {
          toast.success("Сохранено");
          reload();
        }}
      />

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить метрику</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Название</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Категория</Label>
              <Select value={newCategory} onValueChange={(v) => setNewCategory(v as CommercialMetricCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{COMMERCIAL_CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Отмена</Button>
            <Button onClick={handleAddCustom} disabled={!newName.trim()}>Добавить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(hypoPreview)} onOpenChange={(o) => !o && setHypoPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Гипотезы по метрике «{hypoPreview?.name}»</DialogTitle>
          </DialogHeader>
          {linkedHypos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Пока нет связанных гипотез.</p>
          ) : (
            <ul className="space-y-2">
              {linkedHypos.map((h) => (
                <li key={h.id} className="text-sm flex justify-between gap-2">
                  <span>{h.title}</span>
                  <Badge variant="outline">{h.status}</Badge>
                </li>
              ))}
            </ul>
          )}
          {hypoPreview && (
            <Button className="w-full mt-2" onClick={() => createHypothesis(hypoPreview)}>
              <FlaskConical className="h-4 w-4 mr-2" />
              Создать гипотезу по этой метрике
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
