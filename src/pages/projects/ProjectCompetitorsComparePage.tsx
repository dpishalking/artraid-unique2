import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Map, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  buildNicheSnapshot,
  getLatestNicheSnapshot,
  listCompetitors,
} from "@/lib/competitors/api";
import type { NicheSnapshot } from "@/lib/competitors/types";
import { isStaleComparisonTable } from "@/lib/competitors/comparisonTable";
import {
  NicheSnapshotDashboard,
  nicheShareAbsoluteUrl,
} from "@/components/competitors/NicheSnapshotDashboard";

export default function ProjectCompetitorsComparePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [snapshot, setSnapshot] = useState<NicheSnapshot | null>(null);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const autoRebuildAttempted = useRef(false);

  const reload = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [snap, competitors] = await Promise.all([
        getLatestNicheSnapshot(projectId),
        listCompetitors(projectId),
      ]);
      setSnapshot(snap);
      setAnalyzedCount(competitors.filter((c) => c.status === "analyzed").length);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить snapshot");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const canBuild = analyzedCount >= 1;

  const handleBuild = useCallback(async () => {
    if (!projectId || building) return;
    setBuilding(true);
    try {
      await buildNicheSnapshot(projectId);
      toast.success("Карта ниши собрана");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось собрать карту");
    } finally {
      setBuilding(false);
    }
  }, [projectId, building, reload]);

  /** Старые snapshot в БД — один раз пересобираем при открытии страницы. */
  useEffect(() => {
    if (loading || building || !canBuild || !snapshot || autoRebuildAttempted.current) return;
    if (!isStaleComparisonTable(snapshot.artifacts?.comparison_table)) return;
    autoRebuildAttempted.current = true;
    toast.message("Обновляем таблицу разведки…", {
      description: "Старый формат (15 фреймворков) заменяется на 11 критериев из PDF.",
    });
    void handleBuild();
  }, [loading, building, snapshot, canBuild, handleBuild]);

  const handleShare = async () => {
    if (!snapshot?.share_id) return;
    const url = nicheShareAbsoluteUrl(snapshot.share_id);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    } catch {
      toast.message("Публичная ссылка", { description: url });
    }
  };

  if (!projectId) {
    return <p className="text-sm text-muted-foreground">Проект не определён.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to={`/projects/${projectId}/competitors`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> К списку конкурентов
            </Link>
          </Button>
          <h1 className="font-display text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Карта ниши
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mt-1">
            Таблица конкурентной разведки по 11 критериям (как в вашем шаблоне): вы, конкуренты, стратегии и карты.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleBuild} disabled={!canBuild || building}>
            {building ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {snapshot ? "Обновить карту" : "Собрать карту ниши"}
          </Button>
          {snapshot?.share_id && (
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Поделиться
            </Button>
          )}
        </div>
      </div>

      {!canBuild && !loading && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Сначала проанализируйте хотя бы одного конкурента на вкладке{" "}
            <Link to={`/projects/${projectId}/competitors`} className="text-primary underline">
              Конкуренты
            </Link>
            .
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && snapshot && (
        <NicheSnapshotDashboard
          snapshot={snapshot}
          projectId={projectId}
          onRebuildTable={handleBuild}
          rebuildingTable={building}
          footer={
            <p className="text-xs text-muted-foreground text-center">
              Собрано {new Date(snapshot.generated_at).toLocaleString("ru-RU")}
              {snapshot.your_audit_id
                ? " · с вашим аудитом"
                : " · без аудита вашего сайта (запустите аудит с projectId)"}
            </p>
          }
        />
      )}

      {!loading && !snapshot && canBuild && (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Конкуренты проанализированы ({analyzedCount}). Нажмите «Собрать карту ниши» — AI соберёт
              позиционирование и 3 стратегии.
            </p>
            <Button onClick={handleBuild} disabled={building}>
              {building && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Собрать карту ниши
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
