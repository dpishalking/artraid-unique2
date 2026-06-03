import { createProject } from "@/lib/projects/projectApi";
import { ideaLabSessionPath } from "@/lib/navigation/ideaLabUrls";
import { saveIdeaLabState } from "./api";
import { clearIdeaLabDemo, loadIdeaLabDemo, type IdeaLabDemoSession } from "./demoStorage";
import { syncIdeaLabToProject } from "./syncToProject";
import type { CompleteQuizResult } from "@/lib/quiz/completeQuiz";

function projectNameFromDemo(demo: IdeaLabDemoSession): string {
  const name = demo.state.card.idea_name?.trim();
  if (name) return name.slice(0, 80);
  const desc = demo.state.card.short_description?.trim() || demo.seedIdea?.trim();
  if (desc) return desc.split(/[.!?\n]/)[0]?.slice(0, 80) || "Проект с нуля";
  return "Проект с нуля";
}

export async function completeIdeaLabFromDemo(): Promise<CompleteQuizResult> {
  const demo = loadIdeaLabDemo();
  if (!demo) {
    throw new Error("Демо-сессия не найдена — начните диалог заново");
  }

  const productDescription =
    demo.state.card.short_description?.trim() ||
    demo.seedIdea?.trim() ||
    "Идея уточняется в диалоге с наставником";

  const { project } = await createProject({
    name: projectNameFromDemo(demo),
    product_description: productDescription,
    target_audience:
      demo.state.card.target_audience?.trim() || "Уточним в режиме «Проект с нуля»",
    main_goal: "increase_conversion",
    startup_mode: demo.startupMode,
  });

  await saveIdeaLabState(project.id, demo.state);
  try {
    await syncIdeaLabToProject(project.id, demo.state.card, demo.state);
  } catch (e) {
    console.warn("syncIdeaLabToProject:", e);
  }

  clearIdeaLabDemo();

  return {
    projectId: project.id,
    redirectPath: ideaLabSessionPath(project.id),
  };
}
