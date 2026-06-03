import type { Project } from "@/lib/projects/types";
import type { QuickWinScenarioId } from "./types";
import { QUICK_WIN_SCENARIOS } from "./constants";

/** Рекомендованный быстрый сценарий по данным квиза / проекта. */
export function recommendQuickWinScenario(project: Project): QuickWinScenarioId {
  const hasSite = Boolean(project.current_website_url?.trim());
  const goal = project.main_goal;

  if (hasSite && (goal === "find_weak_points" || goal === "increase_conversion")) {
    return "audit";
  }
  if (hasSite && goal === "compare_competitors") {
    return "conversion_gaps";
  }
  if (!hasSite && (goal === "strengthen_offer" || goal === "new_launch")) {
    return "offer";
  }
  if (goal === "new_prototype") {
    return "prototype";
  }
  if (hasSite) {
    return "audit";
  }
  if (project.product_description?.trim()) {
    return "offer";
  }
  return "hero_variants";
}

export function getQuickWinScenario(id: QuickWinScenarioId) {
  return QUICK_WIN_SCENARIOS.find((s) => s.id === id) ?? QUICK_WIN_SCENARIOS[0];
}
