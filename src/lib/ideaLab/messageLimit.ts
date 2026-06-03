import { IDEA_LAB_MESSAGE_LIMIT } from "./constants";
import type { IdeaLabState } from "./types";

export function ideaLabUserMessageCount(state: IdeaLabState): number {
  return state.messages.filter((m) => m.role === "user").length;
}

export function isIdeaLabMessageLimitReached(state: IdeaLabState): boolean {
  return ideaLabUserMessageCount(state) >= IDEA_LAB_MESSAGE_LIMIT;
}

export function ideaLabMessagesRemaining(state: IdeaLabState): number {
  return Math.max(0, IDEA_LAB_MESSAGE_LIMIT - ideaLabUserMessageCount(state));
}
