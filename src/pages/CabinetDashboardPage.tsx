import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  FileText,
  FlaskConical,
  FolderKanban,
  Loader2,
  Plus,
  ScanSearch,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { ProjectBriefWizard } from "@/components/projects/ProjectBriefWizard";
import { ProjectListCard } from "@/components/projects/ProjectListCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { AuthRequiredScreen } from "@/components/navigation/AuthRequiredScreen";
import { deleteProject, getProjects } from "@/lib/projects/projectApi";
import type { Project } from "@/lib/projects/types";
import {
  fetchCabinetAggregateStats,
  type CabinetAggregateStats,
} from "@/lib/projects/cabinetStats";
import { clearLastProjectIfMatch } from "@/lib/navigation/lastProject";
import { isIdeaLabProject } from "@/lib/ideaLab/ideaProjects";
import { cn } from "@/lib/utils";

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: typeof FolderKanban;
  label: string;
  value: number | string;
  hint?: string;
  accent?: "default" | "money" | "primary";
}) {
  const accentClass =
    accent === "money"
      ? "border-money/30 bg-money/5"
      : accent === "primary"
        ? "border-primary/30 bg-primary/5"
        : "border-border/60 bg-card/40";

  return (
    <div className={cn("rounded-xl border px-4 py-3", accentClass)}>
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </div>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export default function CabinetDashboardPage() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<CabinetAggregateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmProject = projects.find((p) => p.id === confirmId);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getProjects()
      .then(async (rows) => {
        if (cancelled) return;
        const workshopProjects = rows.filter((p) => !isIdeaLabProject(p));
        setProjects(workshopProjects);
        setStats(await fetchCabinetAggregateStats(workshopProjects.map((p) => p.id)));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Не удалось загрузить данные");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refreshStats = async (rows: Project[]) => {
    const ids = rows.map((p) => p.id);
    setStats(await fetchCabinetAggregateStats(ids));
  };

  const handleBriefComplete = (projectId: string, nextPath?: string) => {
    setBriefOpen(false);
    nav(nextPath ?? `/projects/${projectId}`);
  };

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deleteProject(confirmId);
      clearLastProjectIfMatch(confirmId);
      setProjects((prev) => prev.filter((p) => p.id !== confirmId));
      toast.success("Проект удалён");
      setConfirmId(null);
      const next = projects.filter((p) => p.id !== confirmId);
      await refreshStats(next);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить проект");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <AuthRequiredScreen
        title="Дашборд"
        description="Сводка по проектам и инструментам доступна после входа."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FlowPageHeader title="Дашборд" hideExit />

      <div className="container mx-auto max-w-5xl space-y-8 px-4 py-8 md:py-10">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {user.email}
            </p>
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Мастерская
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground md:text-base">
              Сводка по всем проектам: аудиты, гипотезы, прототипы и память — в одном месте.
            </p>
          </div>
          <Button size="lg" className="shrink-0 shadow-sm" onClick={() => setBriefOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Создать проект
          </Button>
        </section>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && stats && projects.length > 0 && (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatTile icon={FolderKanban} label="Проекты" value={stats.projectCount} />
            <StatTile
              icon={ScanSearch}
              label="Аудиты"
              value={stats.auditsDone}
              hint={`из ${stats.projectCount} проектов`}
              accent="primary"
            />
            <StatTile icon={FileText} label="Прототипы" value={stats.prototypesTotal} />
            <StatTile
              icon={FlaskConical}
              label="Гипотезы"
              value={stats.hypothesesTotal}
              hint={
                stats.hypothesesActive > 0
                  ? `${stats.hypothesesActive} в работе`
                  : "в лаборатории"
              }
            />
            <StatTile
              icon={Trophy}
              label="Протестировано"
              value={stats.hypothesesTested}
              hint={stats.hypothesesWon > 0 ? `${stats.hypothesesWon} с победой` : undefined}
              accent="money"
            />
            <StatTile
              icon={Brain}
              label="Память"
              value={`${stats.avgMemoryPct}%`}
              hint="средняя заполненность"
            />
          </section>
        )}

        {!loading && !error && projects.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="space-y-4 py-12 text-center">
              <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mx-auto max-w-md text-sm text-muted-foreground">
                Активных проектов пока нет. Создайте первый — после брифа появятся аудит,
                лаборатория гипотез и генератор офферов в контексте вашего продукта.
              </p>
              <Button onClick={() => setBriefOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Создать проект
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && projects.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-base font-semibold tracking-tight">Ваши проекты</h2>
            <div className="grid gap-4 md:gap-5">
              {projects.map((p) => (
                <ProjectListCard key={p.id} project={p} onDelete={() => setConfirmId(p.id)} />
              ))}
            </div>
          </section>
        )}
      </div>

      <AlertDialog open={confirmId != null} onOpenChange={(open) => !open && setConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Проект «{confirmProject?.name ?? ""}» исчезнет из списка. Память и артефакты в базе
              сохранятся, но восстановить через интерфейс будет нельзя.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Удаляем…" : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={briefOpen} onOpenChange={setBriefOpen}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display">Новый проект</SheetTitle>
            <SheetDescription>
              Бриф из 18 вопросов с AI-подсказками. Память проекта заполнится автоматически.
            </SheetDescription>
          </SheetHeader>
          <ProjectBriefWizard
            variant="sheet"
            onCancel={() => setBriefOpen(false)}
            onComplete={handleBriefComplete}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
