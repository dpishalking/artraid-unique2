import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { deleteProject, getProjects } from "@/lib/projects/projectApi";
import { isIdeaLabProject } from "@/lib/ideaLab/ideaProjects";
import type { Project } from "@/lib/projects/types";
import { FlowPageHeader } from "@/components/navigation/FlowPageHeader";
import { clearLastProjectIfMatch } from "@/lib/navigation/lastProject";
import { ProjectListCard } from "@/components/projects/ProjectListCard";

export default function ProjectsListPage() {
  const [rows, setRows] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmProject = rows.find((p) => p.id === confirmId);

  useEffect(() => {
    getProjects()
      .then((rows) => setRows(rows.filter((p) => !isIdeaLabProject(p))))
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка загрузки"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      await deleteProject(confirmId);
      clearLastProjectIfMatch(confirmId);
      setRows((prev) => prev.filter((p) => p.id !== confirmId));
      toast.success("Проект удалён");
      setConfirmId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить проект");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <FlowPageHeader hideExit title="Мои проекты" />
      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm max-w-lg">
            Один раз опишите продукт — дальше все инструменты работают в его контексте.
          </p>
          <Button asChild>
            <Link to="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              Создать проект
            </Link>
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {!loading && !error && rows.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-muted-foreground max-w-md mx-auto">
                Создайте первый проект, чтобы система начала запоминать ваш продукт и помогать с
                офферами, конкурентами и лендингами.
              </p>
              <Button asChild>
                <Link to="/projects/new">Создать проект</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:gap-5">
          {rows.map((p) => (
            <ProjectListCard key={p.id} project={p} onDelete={() => setConfirmId(p.id)} />
          ))}
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
      </div>
    </div>
  );
}
