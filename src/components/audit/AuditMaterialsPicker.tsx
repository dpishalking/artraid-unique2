import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  listProjectFiles,
  uploadProjectContextFile,
  type ProjectFileRow,
} from "@/lib/projectFiles/api";

type Props = {
  projectId: string;
  /** скрыть компактный uploader, если пользователь захочет */
  defaultOpen?: boolean;
};

const ACCEPT =
  ".pdf,.txt,.md,.docx,.rtf,.html,.htm,.csv,.json,.png,.jpg,.jpeg,.webp";

function shortName(name: string, max = 32): string {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 4)}…${name.slice(-4)}`;
}

function statusBadge(s: ProjectFileRow["extraction_status"]) {
  if (s === "ready")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-money/15 px-2 py-0.5 text-[10px] font-medium text-money">
        <CheckCircle2 className="h-3 w-3" />в контексте
      </span>
    );
  if (s === "skipped" || s === "failed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
        <AlertTriangle className="h-3 w-3" />
        без текста
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
      <Loader2 className="h-3 w-3 animate-spin" />
      обрабатывается
    </span>
  );
}

export function AuditMaterialsPicker({ projectId, defaultOpen = false }: Props) {
  const [files, setFiles] = useState<ProjectFileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const reload = useCallback(async () => {
    try {
      const rows = await listProjectFiles(projectId);
      setFiles(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить файлы проекта");
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }, [reload]);

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        await uploadProjectContextFile(projectId, file);
      }
      toast.success("Файл прикреплён к проекту — учтём в аудите");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить файл");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-2xl items-center justify-center rounded-xl border border-dashed border-border/40 py-3 text-xs text-muted-foreground">
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        Проверяем материалы проекта…
      </div>
    );
  }

  const readyFiles = files.filter((f) => f.extraction_status === "ready");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
          open
            ? "border-primary/40 bg-primary/[0.04]"
            : "border-border/50 bg-card/40 hover:border-border hover:bg-card/70",
        )}
      >
        <span className="flex items-center gap-2 text-muted-foreground">
          <Paperclip className="h-4 w-4" />
          {readyFiles.length > 0 ? (
            <span className="text-foreground">
              В аудит подмешаются{" "}
              <strong className="font-semibold text-foreground">{readyFiles.length}</strong>{" "}
              {readyFiles.length === 1
                ? "материал"
                : readyFiles.length < 5
                  ? "материала"
                  : "материалов"}{" "}
              проекта
            </span>
          ) : (
            <span>
              Прикрепить материалы проекта (PDF, презентация, скриншоты рекламы)
            </span>
          )}
        </span>
        <Plus
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-45",
          )}
        />
      </button>

      {open && (
        <div className="space-y-2 rounded-xl border border-border/50 bg-card/30 p-3">
          {files.length > 0 && (
            <ul className="space-y-1.5">
              {files.slice(0, 6).map((f) => (
                <li
                  key={f.id}
                  className="flex items-center gap-2 rounded-lg bg-background/40 px-2.5 py-1.5 text-xs"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-foreground" title={f.original_filename}>
                    {shortName(f.original_filename)}
                  </span>
                  {statusBadge(f.extraction_status)}
                </li>
              ))}
              {files.length > 6 && (
                <li className="text-[11px] text-muted-foreground">
                  и ещё {files.length - 6}…
                </li>
              )}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-3.5 w-3.5" />
              )}
              Добавить файл
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              asChild
              className="text-muted-foreground"
            >
              <Link to={`/projects/${projectId}/files`}>Управлять файлами →</Link>
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>

          <p className="text-[10px] leading-relaxed text-muted-foreground">
            AI сверит обещания на сайте с материалами и отметит несоответствия отдельными
            гипотезами. Не загружайте чувствительные данные — материалы хранятся в проекте.
          </p>
        </div>
      )}
    </div>
  );
}
