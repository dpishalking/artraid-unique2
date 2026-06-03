/** Compact project memory block for AI prompts (edge). */

import {
  formatMergedMemoryForAi,
  normalizeMemoryRowSections,
} from "./projectMemoryAiBlock.ts";

type ProjectRow = Record<string, unknown>;
type ContextRow = Record<string, unknown> | null;

function line(label: string, value: unknown): string | null {
  const s = value == null ? "" : String(value).trim();
  return s ? `${label}: ${s}` : null;
}

function lines(arr: unknown, label: string): string | null {
  if (!Array.isArray(arr) || !arr.length) return null;
  const items = arr.map((x) => String(x).trim()).filter(Boolean).slice(0, 12);
  return items.length ? `${label}: ${items.join("; ")}` : null;
}

export function formatProjectContextForPrompt(project: ProjectRow, context: ContextRow): string {
  const parts: string[] = [
    "## КОНТЕКСТ ПРОЕКТА (память системы — используй как источник правды)",
    line("Название проекта", project.name),
    line("Продукт", context?.product_name ?? project.product_name ?? project.product_description),
    line("Описание", context?.product_description ?? project.product_description),
    line("Целевая аудитория", context?.target_audience ?? project.target_audience),
    line("Текущий оффер", context?.current_offer ?? project.current_offer),
    line("Ключевое обещание", context?.key_promise),
    line("Главная боль", context?.main_pain),
    line("Желание клиента", context?.main_desire),
    line("Позиционирование", context?.positioning),
    line("Уникальный механизм", context?.unique_mechanism),
    line("Сайт", context?.current_website_url ?? project.current_website_url),
    lines(context?.secondary_pains, "Вторичные боли"),
    lines(context?.objections, "Возражения"),
    lines(context?.key_proofs, "Доказательства"),
    line("Заметки", context?.important_notes ?? project.additional_context),
  ].filter((x): x is string => Boolean(x));

  return parts.join("\n");
}

const PER_FILE_CHARS = 7000;
const TOTAL_AI_FILE_CHARS = 28000;

function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n… [остальное текста файла скрыто в промпте — файл целиком в проекте]`;
}

async function formatUploadedProjectFiles(
  admin: {
    from: (table: string) => ReturnType<import("https://esm.sh/@supabase/supabase-js@2.45.0").SupabaseClient["from"]>;
  },
  projectId: string,
): Promise<string> {
  const { data: readyRows } = await admin
    .from("project_files")
    .select("original_filename,extracted_text,created_at")
    .eq("project_id", projectId)
    .eq("extraction_status", "ready")
    .order("created_at", { ascending: true });

  const { data: skippedRows } = await admin
    .from("project_files")
    .select("original_filename,extraction_error,extraction_status")
    .eq("project_id", projectId)
    .in("extraction_status", ["skipped", "failed"])
    .order("created_at", { ascending: true });

  const parts: string[] = [];
  let budget = TOTAL_AI_FILE_CHARS;

  if (Array.isArray(readyRows) && readyRows.length) {
    parts.push("");
    parts.push(`## ЗАГРУЖЕННЫЕ МАТЕРИАЛЫ ПРОЕКТА (из файлов)`);
    parts.push(
      `Ниже — текст из файлов, которые загрузили в карточку проекта. Считай приоритетным при детальных фактах (цифры, формулировки, ограничения). При конфликте с памятью выше — кратко укажи, что противоречит. Фрагментов: ${readyRows.length}.`,
    );

    for (const row of readyRows as { original_filename: string; extracted_text: string | null }[]) {
      const raw = (row.extracted_text ?? "").trim();
      if (!raw) continue;
      const clipped = clip(raw, Math.min(PER_FILE_CHARS, budget));
      if (!clipped) continue;
      budget -= clipped.length;
      parts.push("");
      parts.push(`### Файл: ${row.original_filename}`);
      parts.push(clipped);
      if (budget <= 0) break;
    }

    if (budget <= 0) {
      parts.push("");
      parts.push("(Часть последних загрузок может быть опущена из‑за лимита промпта — они остаются в проекте.)");
    }
  }

  const skipList = Array.isArray(skippedRows)
    ? (skippedRows as { original_filename: string; extraction_error: string | null; extraction_status: string }[])
    : [];

  const namesShort = skipList.map((s) => {
    const hint = String(s.extraction_error ?? "").trim().slice(0, 240);
    return hint ? `${s.original_filename}: ${hint}` : s.original_filename;
  }).filter(Boolean);

  if (namesShort.length) {
    parts.push("");
    parts.push(`### Файлы без извлечённого текста (${namesShort.length})`);
    parts.push(namesShort.slice(0, 40).join("\n"));
  }

  return parts.join("\n").trimEnd();
}

export async function loadProjectContextBlock(
  admin: { from: (table: string) => ReturnType<import("https://esm.sh/@supabase/supabase-js@2.45.0").SupabaseClient["from"]> },
  projectId: string,
  userId: string,
): Promise<string> {
  const { data: project } = await admin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!project) return "";

  const { data: context } = await admin
    .from("project_contexts")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  const { data: memoryRow } = await admin
    .from("project_memories")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  const legacy = formatProjectContextForPrompt(
    project as Record<string, unknown>,
    (context as Record<string, unknown> | null) ?? null,
  );

  let memoryFormatted = "";
  if (memoryRow && typeof memoryRow === "object") {
    const merged = normalizeMemoryRowSections(memoryRow as Record<string, unknown>);
    memoryFormatted = formatMergedMemoryForAi(merged);
  }

  const parts: string[] = [];
  parts.push(`{{project_memory_context}}`);
  if (memoryFormatted.trim()) {
    parts.push(
      `## РАСШИРЕННАЯ ПАМЯТЬ ПРОЕКТА`,
      memoryFormatted,
      `Используй этот блок как основной источник контекста о продукте, аудитории, оффере и ограничениях. Если в нём противоречия с текстом ниже («карточка проекта»), считай приоритетом расширенную память, но упоминай нестыковку при необходимости.`,
    );
  }
  if (legacy.trim()) {
    parts.push(`## Карточка проекта и прежний контекст`, legacy);
  }
  try {
    const filesTail = await formatUploadedProjectFiles(admin, projectId);
    if (filesTail.trim()) {
      parts.push(filesTail);
    }
  } catch (e) {
    console.warn("formatUploadedProjectFiles", e);
  }
  return parts.join("\n").trim();
}
