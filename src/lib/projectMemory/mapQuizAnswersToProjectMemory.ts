import { mainGoalLabel } from "@/lib/projects/constants";
import type { QuizDraft } from "@/lib/quiz/types";
import type { ProjectMemorySections } from "./types";

/** Частичные патчи секций памяти, выводимые из текущего квиза. */
export type QuizMemoryPatches = Partial<
  Pick<ProjectMemorySections, "product" | "audience" | "websites" | "business_metrics">
>;

function trimUrlCandidate(raw?: string): string {
  const s = raw?.trim() ?? "";
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s.replace(/^\/+/, "")}`;
}

/**
 * Преобразует ответы квиза в структуру полей памяти проекта.
 * Названия полей см. типы секций (`ProjectMemorySections`).
 */
export function mapQuizAnswersToProjectMemory(quizAnswers: QuizDraft): QuizMemoryPatches {
  const goalLabel = mainGoalLabel(quizAnswers.mainGoal).trim();

  const productDescription = quizAnswers.productDescription.trim();
  const targetAudience = quizAnswers.targetAudience.trim();

  const websiteRaw = quizAnswers.website?.trim();
  const mainUrl = websiteRaw ? trimUrlCandidate(websiteRaw) : "";

  const patches: QuizMemoryPatches = {
    product: {
      product_description: productDescription,
    },
    audience: {
      target_audience: targetAudience,
    },
    business_metrics: {
      business_goal: goalLabel,
    },
    websites: {
      current_landing_goal: goalLabel,
      ...(websiteRaw
        ? {
            main_website_url: websiteRaw,
            landing_urls: mainUrl ? [mainUrl] : [],
          }
        : {}),
    },
  };

  return patches;
}
