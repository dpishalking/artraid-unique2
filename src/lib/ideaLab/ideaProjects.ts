import { getProjects } from "@/lib/projects/projectApi";
import type { Project } from "@/lib/projects/types";
import { IDEA_LAB_STARTUP_MODES } from "./constants";
import { parseIdeaLabState } from "./state";
import { ideaLabUserMessageCount } from "./messageLimit";

export function isIdeaLabProject(project: Project): boolean {
  return IDEA_LAB_STARTUP_MODES.has(project.startup_mode);
}

export async function getIdeaLabProjects(): Promise<Project[]> {
  const rows = await getProjects();
  return rows.filter(isIdeaLabProject);
}

export function ideaSummaryFromProject(project: Project): {
  clarity: number;
  userMessages: number;
  stage: string;
} {
  const lab = parseIdeaLabState(project.idea_lab_state);
  return {
    clarity: lab.clarityPercent ?? 0,
    userMessages: ideaLabUserMessageCount(lab),
    stage: lab.stage ?? "idea",
  };
}
