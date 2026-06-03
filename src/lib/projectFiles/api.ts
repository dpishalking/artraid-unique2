import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  MAX_UPLOAD_BYTES,
  extractTextFromFile,
  resolveMime,
} from "@/lib/projectFiles/extractText";

export type ProjectFileRow = Tables<"project_files">;

const BUCKET = "project-files";

function sanitizeFilename(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop() ?? "file";
  return base.replace(/[:*?"<>|\u0000-\u001f]/g, "_").trim().slice(0, 180) || "file";
}

export async function listProjectFiles(projectId: string): Promise<ProjectFileRow[]> {
  const { data, error } = await supabase
    .from("project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProjectFileRow[];
}

/** Подписанная ссылка на скачивание из Storage (минута). */
export async function getProjectFileSignedUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 60);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? "Не удалось выдать ссылку на файл");
  return data.signedUrl;
}

export async function deleteProjectFile(projectId: string, fileId: string): Promise<void> {
  const { data: row, error: fetchErr } = await supabase
    .from("project_files")
    .select("id,storage_path")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .maybeSingle();
  if (fetchErr || !row) throw new Error(fetchErr?.message ?? "Файл не найден");

  const path = row.storage_path as string;
  const { error: removeErr } = await supabase.storage.from(BUCKET).remove([path]);
  if (removeErr) console.warn("storage remove:", removeErr);

  const { error: delErr } = await supabase.from("project_files").delete().eq("id", fileId).eq("project_id", projectId);
  if (delErr) throw new Error(delErr.message);
}

export async function uploadProjectContextFile(projectId: string, file: File): Promise<ProjectFileRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Нужно войти, чтобы загрузить файл");

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Размер файла не больше ${MAX_UPLOAD_BYTES / (1024 * 1024)} МБ`);
  }

  const id = crypto.randomUUID();
  const safe = sanitizeFilename(file.name);
  const storagePath = `${user.id}/${projectId}/${id}_${safe}`;
  const resolvedMime = resolveMime(file.name, file.type || "");

  const outcome = await extractTextFromFile(file.name, file.type || "", file);

  const extractionStatus =
    outcome.status === "ready" ? "ready" : outcome.status === "skipped" ? "skipped" : "failed";

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: resolvedMime || "application/octet-stream",
  });
  if (upErr) throw new Error(upErr.message);

  const insertRow = {
    project_id: projectId,
    user_id: user.id,
    storage_path: storagePath,
    original_filename: file.name,
    mime_type: resolvedMime,
    size_bytes: file.size,
    extracted_text: outcome.status === "ready" ? outcome.text : null,
    extraction_status: extractionStatus,
    extraction_error:
      outcome.status === "skipped"
        ? outcome.note
        : outcome.status === "failed"
          ? outcome.error
          : null,
  };

  const { data: inserted, error: rowErr } = await supabase
    .from("project_files")
    .insert(insertRow)
    .select("*")
    .single();

  if (rowErr || !inserted) {
    await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => undefined);
    throw new Error(rowErr?.message ?? "Не удалось сохранить метаданные файла");
  }

  return inserted as ProjectFileRow;
}
