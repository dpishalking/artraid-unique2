import { openingForRole, normalizeCoachRole } from "./roles";
import type { IdeaLabCoachRole, IdeaLabState, StartupMode } from "./types";
import { DEFAULT_IDEA_LAB_STATE } from "./types";

export function buildFreshIdeaLabState(
  startupMode: StartupMode,
  coachRole: IdeaLabCoachRole = "coach",
): IdeaLabState {
  const mode = (startupMode as string) === "unclear" ? "find_idea" : startupMode;
  const role = normalizeCoachRole(coachRole);
  return {
    ...DEFAULT_IDEA_LAB_STATE,
    coachRole: role,
    messages: [
      {
        role: "assistant",
        content: openingForRole(role, mode),
        createdAt: new Date().toISOString(),
      },
    ],
  };
}
