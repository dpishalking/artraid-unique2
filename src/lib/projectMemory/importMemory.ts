import { supabase } from "@/integrations/supabase/client";
import { getProjectById } from "@/lib/projects/projectApi";
import {
  buildPendingMemoryRows,
  countBriefFieldsAvailable,
  flattenMemoryPatch,
  memoryPatchFromBriefAnswers,
  resolveBriefAnswers,
} from "./buildPendingRows";
import { getProjectMemoryRow } from "./api";
import { mergeStoredMemoryIntoSections } from "./mergeSections";

export type MemoryImportResult = {
  ok: boolean;
  created_count: number;
  extracted_count?: number;
  source?: string;
  source_label?: string;
  site_url?: string;
  message?: string;
};

export type MemoryImportSource = "site" | "files" | "voice";

async function callExtractFunction(
  projectId: string,
  payload: Record<string, unknown>,
): Promise<MemoryImportResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Войдите в аккаунт");

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-project-memory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ project_id: projectId, ...payload }),
  });

  const body = (await response.json().catch(() => ({}))) as MemoryImportResult & { error?: string };
  if (!response.ok) throw new Error(body.error || "Не удалось извлечь данные");
  return body;
}

export async function extractMemoryFromSite(projectId: string, url?: string): Promise<MemoryImportResult> {
  return callExtractFunction(projectId, {
    source: "site",
    ...(url?.trim() ? { url: url.trim() } : {}),
  });
}

export async function extractMemoryFromFiles(projectId: string): Promise<MemoryImportResult> {
  return callExtractFunction(projectId, { source: "files" });
}

export async function extractMemoryFromVoice(projectId: string, text: string): Promise<MemoryImportResult> {
  return callExtractFunction(projectId, { source: "voice", text: text.trim() });
}

export async function importMemoryFromBrief(projectId: string): Promise<MemoryImportResult> {
  const bundle = await getProjectById(projectId);
  if (!bundle) throw new Error("Проект не найден");

  const answers = resolveBriefAnswers(bundle.project, bundle.project.quiz_answers_snapshot);
  if (!answers) {
    return {
      ok: true,
      created_count: 0,
      source: "brief",
      message: "Нет данных брифа для импорта",
    };
  }

  const memoryRow = await getProjectMemoryRow(projectId);
  const merged = mergeStoredMemoryIntoSections(memoryRow as unknown as Record<string, unknown>);
  const patch = memoryPatchFromBriefAnswers(answers);
  const flat = flattenMemoryPatch(patch);
  const rows = buildPendingMemoryRows(projectId, "brief_import", "project_brief", flat, merged, {
    fillEmptyOnly: true,
  });

  if (!rows.length) {
    return {
      ok: true,
      created_count: 0,
      extracted_count: flat.length,
      source: "brief",
      message: "Поля из брифа уже есть в памяти",
    };
  }

  await supabase
    .from("project_memory_updates")
    .delete()
    .eq("project_id", projectId)
    .eq("source_type", "brief_import")
    .eq("status", "pending");

  const { error } = await supabase.from("project_memory_updates").insert(rows);
  if (error) throw new Error(error.message);

  return {
    ok: true,
    created_count: rows.length,
    extracted_count: flat.length,
    source: "brief",
    source_label: "Ответы брифа",
  };
}

export async function getBriefImportAvailability(projectId: string): Promise<{ available: boolean; fieldCount: number }> {
  const bundle = await getProjectById(projectId);
  if (!bundle) return { available: false, fieldCount: 0 };
  const answers = resolveBriefAnswers(bundle.project, bundle.project.quiz_answers_snapshot);
  if (!answers) return { available: false, fieldCount: 0 };
  return { available: true, fieldCount: countBriefFieldsAvailable(answers) };
}
