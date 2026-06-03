import { supabase } from "@/integrations/supabase/client";
import type {
  ProjectMemoryRow,
  ProjectMemorySections,
} from "./types";
import { mergeStoredMemoryIntoSections } from "./mergeSections";
import {
  calculateProjectMemoryCompletionPct,
  evaluateAutoBadges,
  levelSlugFromCompletion,
  mergeBadges,
  sectionProgress,
} from "./completion";

type DbMemoryRow = Record<string, unknown>;

export function rowToResolvedMemory(raw: DbMemoryRow): ProjectMemoryRow {
  const sections = mergeStoredMemoryIntoSections(raw);
  return {
    id: String(raw.id ?? ""),
    project_id: String(raw.project_id ?? ""),
    completion_percent:
      typeof raw.completion_percent === "number" ? raw.completion_percent : 0,
    completion_level:
      typeof raw.completion_level === "string"
        ? raw.completion_level
        : levelSlugFromCompletion(0),
    badges: Array.isArray(raw.badges) ? raw.badges.map(String) : [],
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
    ...sections,
  };
}

export async function ensureProjectMemory(projectId: string): Promise<ProjectMemoryRow> {
  const existing = await supabase
    .from("project_memories")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();

  if (existing.error) throw existing.error;
  if (existing.data) return rowToResolvedMemory(existing.data as DbMemoryRow);

  const inserted = await supabase
    .from("project_memories")
    .insert({ project_id: projectId })
    .select("*")
    .single();

  if (inserted.error) throw inserted.error;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.id) {
    await supabase.from("project_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "project_memory_created",
      title: "Память проекта готова к заполнению",
      description: "Структура данных создана автоматически.",
    });
  }

  return rowToResolvedMemory(inserted.data as DbMemoryRow);
}

export async function getProjectMemoryRow(projectId: string): Promise<ProjectMemoryRow> {
  return ensureProjectMemory(projectId);
}

export async function saveProjectMemorySection<K extends keyof ProjectMemorySections>(
  projectId: string,
  section: K,
  value: ProjectMemorySections[K],
): Promise<ProjectMemoryRow> {
  const { data: currentRowDb, error: curErr } = await supabase
    .from("project_memories")
    .select("*")
    .eq("project_id", projectId)
    .maybeSingle();
  if (curErr) throw curErr;

  const currentMerged = mergeStoredMemoryIntoSections((currentRowDb ?? {}) as DbMemoryRow);
  const progressBeforeRat = sectionProgress(section, currentMerged);

  const nextMerged: ProjectMemorySections = {
    ...currentMerged,
    [section]: value,
  };

  const pct = calculateProjectMemoryCompletionPct(nextMerged);
  const level = levelSlugFromCompletion(pct);
  const prevBadges = Array.isArray((currentRowDb as DbMemoryRow)?.badges)
    ? ((currentRowDb as DbMemoryRow).badges as string[])
    : [];
  const auto = evaluateAutoBadges(pct, nextMerged);
  const { badges, newlyUnlocked } = mergeBadges(prevBadges, auto);

  const patch: Record<string, unknown> = {
    [String(section)]: value as unknown,
    completion_percent: pct,
    completion_level: level,
    badges,
  };

  const updated = await supabase
    .from("project_memories")
    .update(patch)
    .eq("project_id", projectId)
    .select("*")
    .single();

  if (updated.error) throw updated.error;

  const progressAfterRat = sectionProgress(section, nextMerged);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id) {
    await supabase.from("project_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "project_memory_updated",
      title: "Память проекта обновлена",
      description: `Раздел сохранён: ${String(section)}`,
      metadata: { section, completion_percent: pct },
    });

    if (progressAfterRat >= 0.92 && progressBeforeRat < 0.92) {
      await supabase.from("project_events").insert({
        project_id: projectId,
        user_id: user.id,
        event_type: "project_memory_section_completed",
        title: "Раздел памяти заполнен почти полностью",
        description: String(section),
        metadata: { section },
      });
    }

    for (const b of newlyUnlocked) {
      await supabase.from("project_events").insert({
        project_id: projectId,
        user_id: user.id,
        event_type: "project_memory_badge_unlocked",
        title: "Новый бейдж памяти",
        description: b,
        metadata: { badge_id: b },
      });
    }
  }

  await supabase
    .from("projects")
    .update({
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  return rowToResolvedMemory(updated.data as DbMemoryRow);
}

export async function listPendingMemoryUpdates(projectId: string) {
  const { data, error } = await supabase
    .from("project_memory_updates")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) throw error;
  return data ?? [];
}

export async function applyAllPendingMemorySuggestions(
  rows: Record<string, unknown>[],
): Promise<ProjectMemoryRow | null> {
  if (!rows.length) return null;
  let last: ProjectMemoryRow | null = null;
  for (const row of rows) {
    last = await applyStructuredMemorySuggestion(row);
  }
  return last;
}

export async function rejectAllPendingMemorySuggestions(ids: string[]) {
  if (!ids.length) return;
  const { error } = await supabase
    .from("project_memory_updates")
    .update({ status: "rejected" })
    .in("id", ids);
  if (error) throw error;
}

export async function setMemoryUpdateStatus(id: string, status: "accepted" | "rejected") {
  const patch =
    status === "accepted"
      ? { status, applied_at: new Date().toISOString() }
      : { status };
  const { error } = await supabase.from("project_memory_updates").update(patch).eq("id", id);
  if (error) throw error;
}

function coerceUiValue(raw: unknown): unknown {
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") return raw;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return raw;
  return "";
}

/** Применить одно предложенное изменение памяти (без доп. подтверждений модалкой). */
export async function applyStructuredMemorySuggestion(
  row: Record<string, unknown>,
): Promise<ProjectMemoryRow> {
  const projectId = String(row.project_id);
  const section = String(row.section) as keyof ProjectMemorySections;
  const field = String(row.field ?? "");
  const suggested = row.suggested_value ?? "";

  const known: (keyof ProjectMemorySections)[] = [
    "company",
    "founder",
    "product",
    "audience",
    "pains_desires",
    "offer_positioning",
    "websites",
    "proofs",
    "pricing",
    "business_metrics",
    "tone",
    "constraints",
  ];
  if (!known.includes(section)) {
    throw new Error(`Секция «${String(section)}» пока не поддерживается для авто-слияния.`);
  }
  if (!field) throw new Error("Не указано поле для сохранения.");

  const snapshot = mergeStoredMemoryIntoSections(
    (
      await supabase.from("project_memories").select("*").eq("project_id", projectId).maybeSingle()
    ).data as DbMemoryRow | null ?? {},
  );

  const currentBranch = snapshot[section] as Record<string, unknown>;
  const nextBranch = { ...currentBranch, [field]: coerceUiValue(suggested) };
  await saveProjectMemorySection(projectId, section, nextBranch as ProjectMemorySections[typeof section]);
  await setMemoryUpdateStatus(String(row.id), "accepted");
  return getProjectMemoryRow(projectId);
}
