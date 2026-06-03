import { QUIZ_STORAGE_KEY } from "./constants";
import type { QuizDraft } from "./types";
import type { StartupMode } from "@/lib/ideaLab/types";

function parseDraftRaw(raw: string | null): QuizDraft | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as QuizDraft & { startupMode?: StartupMode | "unclear" };
    const rawMode = o.startupMode ?? "has_business";
    const mode: StartupMode =
      rawMode === "unclear" ? "find_idea" : rawMode;
    if (!o.mainGoal) return null;
    if (mode === "has_business") {
      if (!o.productDescription?.trim() || !o.targetAudience?.trim()) return null;
    } else if (mode === "has_idea") {
      if (!o.productDescription?.trim()) return null;
    } else {
      /* find_idea — достаточно режима */
    }
    return {
      startupMode: mode,
      productDescription: (o.productDescription?.trim() || "Идея уточняется в диалоге с наставником"),
      targetAudience: (o.targetAudience?.trim() || "Уточним в режиме «Проект с нуля»"),
      mainGoal: o.mainGoal,
      website: o.website?.trim() || undefined,
    };
  } catch {
    return null;
  }
}

export function loadQuizDraft(): QuizDraft | null {
  if (typeof window === "undefined") return null;
  return (
    parseDraftRaw(sessionStorage.getItem(QUIZ_STORAGE_KEY)) ??
    parseDraftRaw(localStorage.getItem(QUIZ_STORAGE_KEY))
  );
}

export function saveQuizDraft(draft: QuizDraft): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(draft);
  try {
    sessionStorage.setItem(QUIZ_STORAGE_KEY, payload);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(QUIZ_STORAGE_KEY, payload);
  } catch {
    /* ignore */
  }
}

export function clearQuizDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(QUIZ_STORAGE_KEY);
  try {
    localStorage.removeItem(QUIZ_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function projectNameFromDraft(draft: QuizDraft): string {
  if (draft.startupMode !== "has_business") {
    return "Проект с нуля";
  }
  const line = draft.productDescription.trim().split(/[.!?\n]/)[0]?.trim() ?? "Проект";
  return line.length > 48 ? `${line.slice(0, 45)}…` : line;
}
