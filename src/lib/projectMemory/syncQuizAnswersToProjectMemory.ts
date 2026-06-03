import { supabase } from "@/integrations/supabase/client";
import type { QuizDraft } from "@/lib/quiz/types";
import {
  calculateProjectMemoryCompletionPct,
  evaluateAutoBadges,
  levelSlugFromCompletion,
  mergeBadges,
} from "./completion";
import { mapQuizAnswersToProjectMemory } from "./mapQuizAnswersToProjectMemory";
import { mergeStoredMemoryIntoSections } from "./mergeSections";
import type { ProjectMemorySections } from "./types";
import { rowToResolvedMemory } from "./api";

type DbMemoryRow = Record<string, unknown>;

const MEMORY_JSON_COLS = [
  "company",
  "founder",
  "product",
  "audience",
  "pains_desires",
  "offer_positioning",
  "websites",
  "competitors",
  "proofs",
  "objections",
  "pricing",
  "business_metrics",
  "tone",
  "constraints",
] as const satisfies ReadonlyArray<keyof ProjectMemorySections>;

export type QuizSyncResult = {
  memory: ReturnType<typeof rowToResolvedMemory>;
  fieldsFilled: string[];
  conflictsRaised: number;
  completion_percent: number;
};

function cloneSections(s: ProjectMemorySections): ProjectMemorySections {
  return JSON.parse(JSON.stringify(s)) as ProjectMemorySections;
}

function isEmptyStoredScalar(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return !v.trim();
  return false;
}

function isEffectivelyEmptyLandingUrls(arr: unknown): boolean {
  if (!Array.isArray(arr)) return true;
  return !arr.some((x) => String(x ?? "").trim());
}

function normalizedEquals(a: unknown, b: unknown): boolean {
  if (typeof a === "string" && typeof b === "string") {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }
  return JSON.stringify(a) === JSON.stringify(b);
}

function toJsonSafe(val: unknown) {
  if (val === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(val));
  } catch {
    return null;
  }
}

export async function syncQuizAnswersToProjectMemory(
  projectId: string,
  quizAnswers: QuizDraft,
): Promise<QuizSyncResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? null;

  const { data: projectRowRaw, error: pErr } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!projectRowRaw) throw new Error("Проект не найден");

  const projectRow = projectRowRaw as Record<string, unknown>;
  const wasQuizCompleted = Boolean(projectRow.quiz_completed);

  const {
    data: memRowRaw,
    error: mErr,
  } = await supabase.from("project_memories").select("*").eq("project_id", projectId).maybeSingle();
  if (mErr) throw mErr;

  let currentDb: DbMemoryRow;
  if (!memRowRaw) {
    const ins = await supabase
      .from("project_memories")
      .insert({ project_id: projectId })
      .select("*")
      .single();
    if (ins.error) throw ins.error;
    currentDb = ins.data as DbMemoryRow;
  } else {
    currentDb = memRowRaw as DbMemoryRow;
  }

  const pctBefore = calculateProjectMemoryCompletionPct(mergeStoredMemoryIntoSections(currentDb));
  const next = cloneSections(mergeStoredMemoryIntoSections(currentDb));
  const patch = mapQuizAnswersToProjectMemory(quizAnswers);

  const fieldsFilled: string[] = [];
  let conflictsRaised = 0;

  async function pendingSuggestionExists(section: string, field: string): Promise<boolean> {
    const { data } = await supabase
      .from("project_memory_updates")
      .select("id")
      .eq("project_id", projectId)
      .eq("status", "pending")
      .eq("source_type", "quiz_sync")
      .eq("section", section)
      .eq("field", field)
      .maybeSingle();
    return Boolean(data?.id);
  }

  async function raiseConflict(section: string, field: string, oldVal: unknown, suggested: unknown) {
    if (!userId) {
      conflictsRaised += 1;
      return;
    }
    if (await pendingSuggestionExists(section, field)) return;
    conflictsRaised += 1;
    const { error } = await supabase.from("project_memory_updates").insert({
      project_id: projectId,
      source_type: "quiz_sync",
      source_id: "onboarding_quiz",
      section,
      field,
      old_value: toJsonSafe(oldVal),
      suggested_value: toJsonSafe(suggested) ?? {},
      status: "pending",
    });
    if (error) console.warn("project_memory_updates insert:", error.message);
  }

  function fillScalar(section: keyof ProjectMemorySections, field: string, quizVal: unknown) {
    if (quizVal == null) return;
    if (typeof quizVal === "string" && !quizVal.trim()) return;

    const sec = next[section];
    if (!sec || typeof sec !== "object" || Array.isArray(sec)) return;
    const rec = sec as Record<string, unknown>;
    const cur = rec[field];

    if (isEmptyStoredScalar(cur)) {
      rec[field] = quizVal;
      fieldsFilled.push(`${section}.${field}`);
      return;
    }

    if (normalizedEquals(cur, quizVal)) return;
    void raiseConflict(section, field, cur, quizVal);
  }

  if (patch.product) {
    for (const [k, v] of Object.entries(patch.product)) {
      if (v !== undefined) fillScalar("product", k, v);
    }
  }
  if (patch.audience) {
    for (const [k, v] of Object.entries(patch.audience)) {
      if (v !== undefined) fillScalar("audience", k, v);
    }
  }
  if (patch.business_metrics) {
    for (const [k, v] of Object.entries(patch.business_metrics)) {
      if (v !== undefined) fillScalar("business_metrics", k, v);
    }
  }

  if (patch.websites) {
    const pw = patch.websites;
    if (pw.main_website_url !== undefined) fillScalar("websites", "main_website_url", pw.main_website_url);
    if (pw.current_landing_goal !== undefined) fillScalar("websites", "current_landing_goal", pw.current_landing_goal);
    if (pw.current_landing_problem !== undefined) {
      fillScalar("websites", "current_landing_problem", pw.current_landing_problem);
    }

    const quizUrls = pw.landing_urls?.map((x) => String(x).trim()).filter(Boolean) ?? [];
    if (quizUrls.length) {
      const curr = next.websites.landing_urls ?? [];
      if (isEffectivelyEmptyLandingUrls(curr)) {
        next.websites.landing_urls = [...quizUrls];
        fieldsFilled.push("websites.landing_urls");
      } else if (!normalizedEquals(curr, quizUrls)) {
        if (await pendingSuggestionExists("websites", "landing_urls")) {
          /* уже есть предложение */
        } else {
          conflictsRaised += 1;
          if (userId) {
            const { error } = await supabase.from("project_memory_updates").insert({
              project_id: projectId,
              source_type: "quiz_sync",
              source_id: "onboarding_quiz",
              section: "websites",
              field: "landing_urls",
              old_value: toJsonSafe(curr),
              suggested_value: toJsonSafe(quizUrls) ?? [],
              status: "pending",
            });
            if (error) console.warn("project_memory_updates insert:", error.message);
          }
        }
      }
    }
  }

  const pct = calculateProjectMemoryCompletionPct(next);
  const level = levelSlugFromCompletion(pct);

  const prevBadges = Array.isArray(currentDb.badges)
    ? (currentDb.badges as string[]).map(String)
    : [];
  const auto = evaluateAutoBadges(pct, next);
  const { badges, newlyUnlocked } = mergeBadges(prevBadges, auto);

  const memPatch: Record<string, unknown> = {
    completion_percent: pct,
    completion_level: level,
    badges,
  };

  for (const col of MEMORY_JSON_COLS) {
    memPatch[col as string] = next[col];
  }

  const { data: updatedRow, error: uErr } = await supabase
    .from("project_memories")
    .update(memPatch)
    .eq("project_id", projectId)
    .select("*")
    .single();
  if (uErr) throw uErr;

  const snapshotAnswers = {
    ...quizAnswers,
    mainGoal: quizAnswers.mainGoal,
  };

  const { error: projUpdErr } = await supabase
    .from("projects")
    .update({
      quiz_completed: true,
      quiz_answers_snapshot: snapshotAnswers,
      quiz_synced_at: new Date().toISOString(),
      quiz_memory_mapped_fields: fieldsFilled.length ? fieldsFilled : [],
      updated_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (projUpdErr) console.warn("projects quiz fields update:", projUpdErr.message);

  const nowIso = new Date().toISOString();

  if (userId) {
    const eventRows: {
      project_id: string;
      user_id: string;
      event_type: string;
      title: string;
      description: string | null;
      metadata?: Record<string, unknown>;
    }[] = [];

    if (!wasQuizCompleted) {
      eventRows.push({
        project_id: projectId,
        user_id: userId,
        event_type: "quiz_completed",
        title: "Квиз завершён",
        description: "Ответы сохранены и учтены при создании проекта.",
        metadata: { goal: quizAnswers.mainGoal },
      });
    }

    eventRows.push({
      project_id: projectId,
      user_id: userId,
      event_type: "quiz_answers_synced",
      title: "Ответы квиза синхронизированы с памятью проекта",
      description:
        conflictsRaised > 0
          ? `Заполнено полей из квиза: ${fieldsFilled.length}. Обнаружено расхождений с уже введёнными данными — проверьте предложения в блоке памяти.`
          : `Перенесено полей памяти: ${fieldsFilled.length}.`,
      metadata: {
        fields_filled: fieldsFilled,
        conflicts_pending: conflictsRaised,
      },
    });

    if (fieldsFilled.length > 0) {
      eventRows.push({
        project_id: projectId,
        user_id: userId,
        event_type: "project_memory_updated_from_quiz",
        title: "Память проекта пополнена из квиза",
        description: "Пустые поля заполнены ответами квиза без перезаписи ваших правок.",
        metadata: { fields_filled: fieldsFilled },
      });
    }

    eventRows.push({
      project_id: projectId,
      user_id: userId,
      event_type: "project_memory_completion_recalculated",
      title: "Пересчитана заполненность памяти проекта",
      description: `Было ${pctBefore}%, стало ${pct}%.`,
      metadata: {
        completion_percent_before: pctBefore,
        completion_percent_after: pct,
      },
    });

    await supabase.from("project_events").insert(eventRows);

    for (const b of newlyUnlocked) {
      await supabase.from("project_events").insert({
        project_id: projectId,
        user_id: userId,
        event_type: "project_memory_badge_unlocked",
        title: "Новый бейдж памяти",
        description: b,
        metadata: { badge_id: b, source: "quiz_sync" },
      });
    }
  }

  return {
    memory: rowToResolvedMemory(updatedRow as DbMemoryRow),
    fieldsFilled,
    conflictsRaised,
    completion_percent: pct,
  };
}
