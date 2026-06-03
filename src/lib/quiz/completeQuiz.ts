import {
  buildProjectContextWithAi,
  createProject,
  mergeCompetitorUrls,
} from "@/lib/projects/projectApi";
import { syncQuizAnswersToProjectMemory } from "@/lib/projectMemory/syncQuizAnswersToProjectMemory";
import { rememberLastProject } from "@/lib/navigation/lastProject";
import { ideaLabSessionPath } from "@/lib/navigation/ideaLabUrls";
import { clearQuizDraft, projectNameFromDraft } from "./draft";
import type { QuizDraft } from "./types";

export type CompleteQuizResult = {
  projectId: string;
  redirectPath: string;
};

export type CompleteQuizOptions = {
  /** Куда вести после создания: project — сразу в обзор, onboarding — post-quiz flow */
  redirectTo?: "project" | "onboarding";
};

export async function completeQuizFromDraft(
  draft: QuizDraft,
  options?: CompleteQuizOptions,
): Promise<CompleteQuizResult> {
  const productName = draft.productName?.trim();
  const { project } = await createProject({
    name: productName || projectNameFromDraft(draft),
    product_name: productName || undefined,
    product_description: draft.productDescription.trim(),
    target_audience: draft.targetAudience.trim(),
    main_goal: draft.mainGoal,
    current_website_url: draft.website?.trim() || undefined,
    competitors: mergeCompetitorUrls(),
    startup_mode: draft.startupMode,
  });

  try {
    await syncQuizAnswersToProjectMemory(project.id, draft);
  } catch (e) {
    console.warn("syncQuizAnswersToProjectMemory:", e);
  }

  if (draft.startupMode === "has_business") {
    try {
      await buildProjectContextWithAi(project.id);
    } catch {
      /* карту можно обновить позже */
    }
  }

  clearQuizDraft();
  rememberLastProject(project.id);

  let redirectPath: string;
  if (options?.redirectTo === "project") {
    redirectPath = `/projects/${project.id}`;
  } else if (draft.startupMode === "has_business") {
    redirectPath = `/projects/${project.id}/onboarding`;
  } else {
    redirectPath = ideaLabSessionPath(project.id);
  }

  return { projectId: project.id, redirectPath };
}
