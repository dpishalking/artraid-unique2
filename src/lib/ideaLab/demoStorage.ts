import type { IdeaLabState, StartupMode, IdeaLabCoachRole } from "./types";
import { buildFreshIdeaLabState } from "./session";
import { parseIdeaLabState } from "./state";

export const IDEA_LAB_DEMO_KEY = "mm_idea_lab_demo_v1";
export const DEMO_MESSAGE_LIMIT = 24;

export type IdeaLabDemoSession = {
  sessionId: string;
  startupMode: StartupMode;
  seedIdea?: string;
  state: IdeaLabState;
  createdAt: string;
};

function newSessionId(): string {
  return crypto.randomUUID();
}

export function loadIdeaLabDemo(): IdeaLabDemoSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(IDEA_LAB_DEMO_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as IdeaLabDemoSession;
    if (!o.sessionId || !o.startupMode || !o.state) return null;
    return {
      ...o,
      state: parseIdeaLabState(o.state),
    };
  } catch {
    return null;
  }
}

export function saveIdeaLabDemo(session: IdeaLabDemoSession): void {
  try {
    localStorage.setItem(IDEA_LAB_DEMO_KEY, JSON.stringify(session));
  } catch {
    /* quota */
  }
}

export function clearIdeaLabDemo(): void {
  try {
    localStorage.removeItem(IDEA_LAB_DEMO_KEY);
  } catch {
    /* ignore */
  }
}

export function initIdeaLabDemo(
  startupMode: StartupMode,
  seedIdea?: string,
  coachRole: IdeaLabCoachRole = "coach",
): IdeaLabDemoSession {
  const mode = (startupMode as string) === "unclear" ? "find_idea" : startupMode;
  const fresh = buildFreshIdeaLabState(mode, coachRole);
  const messages =
    seedIdea && seedIdea.trim().length >= 3
      ? [
          ...fresh.messages,
          {
            role: "user" as const,
            content: seedIdea.trim(),
            createdAt: new Date().toISOString(),
          },
        ]
      : fresh.messages;

  const session: IdeaLabDemoSession = {
    sessionId: newSessionId(),
    startupMode: mode,
    seedIdea: seedIdea?.trim() || undefined,
    state: {
      ...fresh,
      messages,
      card: seedIdea?.trim()
        ? { short_description: seedIdea.trim(), idea_name: seedIdea.trim().slice(0, 80) }
        : {},
    },
    createdAt: new Date().toISOString(),
  };
  saveIdeaLabDemo(session);
  return session;
}

export function demoNeedsFirstReply(session: IdeaLabDemoSession): boolean {
  return Boolean(
    session.seedIdea &&
      session.state.messages.length === 2 &&
      session.state.messages[1]?.role === "user",
  );
}

export function demoMessageCount(session: IdeaLabDemoSession): number {
  return session.state.messages.filter((m) => m.role === "user").length;
}

export function isDemoLimitReached(session: IdeaLabDemoSession): boolean {
  return demoMessageCount(session) >= DEMO_MESSAGE_LIMIT;
}
