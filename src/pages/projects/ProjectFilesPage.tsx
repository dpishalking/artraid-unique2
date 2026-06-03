import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Download, FileUp, Loader2, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  deleteProjectFile,
  getProjectFileSignedUrl,
  listProjectFiles,
  uploadProjectContextFile,
  type ProjectFileRow,
} from "@/lib/projectFiles/api";

const STATUS_LABELS: Record<string, string> = {
  pending: "В очереди",
  ready: "В контексте AI",
  failed: "Ошибка",
  skipped: "Без текста",
};

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "ready") return "default";
  if (s === "failed") return "destructive";
  if (s === "skipped") return "outline";
  return "secondary";
}

export default function ProjectFilesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [rows, setRows] = useState<ProjectFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const reload = useCallback(async () => {
    if (!projectId) return;
    const next = await listProjectFiles(projectId);
    setRows(next);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    reload()
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить список"))
      .finally(() => setLoading(false));
  }, [projectId, reload]);

  const onPickFiles = async (list: FileList | null) => {
    if (!projectId || !list?.length || uploading) return;
    setUploading(true);
    try {
      for (const file of Array.from(list)) {
        try {
          await uploadProjectContextFile(projectId, file);
          toast.success(`Загружено: ${file.name}`);
        } catch (e) {
          toast.error(`${file.name}: ${e instanceof Error ? e.message : "ошибка"}`);
        }
      }
      await reload();
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (row: ProjectFileRow) => {
    try {
      const url = await getProjectFileSignedUrl(row.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Скачивание недоступно");
    }
  };

  const handleDelete = async (row: ProjectFileRow) => {
    if (!projectId) return;
    if (!window.confirm(`Удалить файл «${row.original_filename}»? Это действие необратимо.`)) return;
    try {
      await deleteProjectFile(projectId, row.id);
      toast.success("Удалено");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить");
    }
  };

  if (!projectId) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight flex items-center gap-2">
          <FolderOpen className="h-8 w-8 text-money" />
          Файлы проекта
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Загружайте всё полезное по проекту: брифы, отчёты, переписки, прайсы, оферты и т.д. Текст из поддерживаемых
          файлов добавляется в промпт при аудите оффере и прототипе для этого проекта. Остальные файлы всё равно хранятся и в
          отчёт модели попадают как список (без содержания).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Загрузка</CardTitle>
          <CardDescription>
            До 8 МБ каждый, любые расширения: всё сохраняется приватно. Текст в модель попадает из обычного PDF (не скан без
            слоя текста), .txt/.md/.json/.csv/.html и других текстовых форматов. Остальное — архив документов + подсказка в
            контексте.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Button variant="outline" disabled={uploading} asChild>
            <label className="cursor-pointer">
              <FileUp className="mr-2 h-4 w-4" />
              {uploading ? "Загрузка…" : "Выбрать файлы"}
              <input
                type="file"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void onPickFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </Button>
          {uploading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Хранилище</CardTitle>
          <CardDescription>
            Строки с пометкой «В контексте AI» участвуют в промптах инструментов с привязкой к проекту.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Пока нет загруженных файлов.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-sm truncate" title={row.original_filename}>
                      {row.original_filename}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(row.mime_type ?? "").slice(0, 80)}
                      {(row.size_bytes ?? 0) >= 1024 ? ` · ${(row.size_bytes / 1024).toFixed(0)} KB` : ` · ${row.size_bytes ?? 0} B`}
                      {" · "}
                      {new Date(row.created_at).toLocaleString("ru-RU")}
                    </p>
                    {(row.extraction_error ?? "").trim().length > 0 && row.extraction_status !== "ready" && (
                      <p className="text-xs text-muted-foreground">{row.extraction_error}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge variant={statusVariant(row.extraction_status)}>{STATUS_LABELS[row.extraction_status] ?? row.extraction_status}</Badge>
                    <Button variant="outline" size="sm" type="button" onClick={() => void handleDownload(row)}>
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Скачать
                    </Button>
                    <Button variant="ghost" size="sm" type="button" className="text-destructive" onClick={() => void handleDelete(row)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Связано с проектом:{" "}
        <Button variant="link" className="h-auto p-0 text-xs" asChild>
          <Link to={`/projects/${projectId}/memory`}>Память проекта</Link>
        </Button>
      </p>
    </div>
  );
}
