import { supabase } from "@/integrations/supabase/client";
import type {
  CoachProposal,
  IdeaLabCard,
  IdeaLabCoachMeta,
  IdeaLabMessage,
  IdeaLabServiceHandoff,
  IdeaLabState,
  IdeaLabStageId,
  IdeaLabTurnMode,
  IdeaLabCoachRole,
} from "./types";
import { isReadyForOfferHandoff, buildOfferHandoff } from "./handoff";
import { parseIdeaLabState, mergeCard } from "./state";
import { calculateClarityPercent } from "./clarity";
import type { IdeaLabStageId, StartupMode } from "./types";

export type IdeaLabChatResponse = {
  reply: string;
  stage: IdeaLabStageId;
  clarity_percent: number;
  card: Partial<IdeaLabCard>;
  interim_summary?: string;
  insight?: string;
  assumptions?: string[];
  proposals?: CoachProposal[];
  turn_mode?: IdeaLabTurnMode;
  handoff?: IdeaLabServiceHandoff;
};

function messagesForApi(messages: IdeaLabMessage[]) {
  return messages.slice(-20).map((m) => ({
    role: m.role,
    content: m.content,
    ...(m.coach ? { coach: m.coach } : {}),
  }));
}

type ChatAuth = {
  bearer: string;
  apikey: string;
};

async function chatAuth(): Promise<ChatAuth> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    bearer: session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

async function postIdeaLabChat(body: Record<string, unknown>): Promise<IdeaLabChatResponse> {
  const { bearer, apikey } = await chatAuth();
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idea-lab-chat`;

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
      apikey,
    },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(typeof data?.error === "string" ? data.error : "Не удалось получить ответ наставника");
  }
  return data as IdeaLabChatResponse;
}

export async function fetchIdeaLabChat(
  projectId: string,
  userMessage: string,
  messages: IdeaLabMessage[],
  coachRole?: IdeaLabCoachRole,
): Promise<IdeaLabChatResponse> {
  return postIdeaLabChat({
    project_id: projectId,
    message: userMessage,
    messages: messagesForApi(messages),
    coach_role: coachRole ?? "coach",
  });
}

export type IdeaLabDemoChatParams = {
  sessionId: string;
  startupMode: StartupMode;
  userMessage: string;
  messages: IdeaLabMessage[];
  card: IdeaLabCard;
  seedIdea?: string;
  coachRole?: IdeaLabCoachRole;
};

export async function fetchIdeaLabChatDemo(
  params: IdeaLabDemoChatParams,
): Promise<IdeaLabChatResponse> {
  return postIdeaLabChat({
    demo: true,
    demo_session_id: params.sessionId,
    startup_mode: params.startupMode,
    message: params.userMessage,
    messages: messagesForApi(params.messages),
    card: params.card,
    seed_idea: params.seedIdea,
    coach_role: params.coachRole ?? "coach",
  });
}

function coachMetaFromResponse(res: IdeaLabChatResponse): IdeaLabCoachMeta | undefined {
  const coach: IdeaLabCoachMeta = {};
  if (res.insight?.trim()) coach.insight = res.insight.trim();
  if (res.interim_summary?.trim()) coach.interim_summary = res.interim_summary.trim();
  if (res.assumptions?.length) coach.assumptions = res.assumptions;
  if (res.proposals?.length) coach.proposals = res.proposals;
  if (res.turn_mode) coach.turn_mode = res.turn_mode;
  if (res.handoff) coach.handoff = res.handoff;
  return Object.keys(coach).length > 0 ? coach : undefined;
}

function resolveHandoff(
  res: IdeaLabChatResponse,
  userText: string,
  stage: IdeaLabStageId,
  card: IdeaLabCard,
): IdeaLabServiceHandoff | undefined {
  const clarity = res.clarity_percent ?? 0;
  if (!isReadyForOfferHandoff(stage, clarity, card, userText)) return undefined;
  return res.handoff ?? buildOfferHandoff(userText);
}

export function applyChatResponseLocal(
  prev: IdeaLabState,
  userText: string,
  res: IdeaLabChatResponse,
): IdeaLabState {
  const now = new Date().toISOString();
  const card = mergeCard(prev.card, res.card ?? {});
  const stage = res.stage ?? prev.stage;
  const handoff = resolveHandoff(res, userText, stage, card);
  const coach = coachMetaFromResponse({ ...res, handoff: handoff ?? res.handoff });
  return {
    ...prev,
    stage: res.stage ?? prev.stage,
    card,
    clarityPercent: res.clarity_percent ?? calculateClarityPercent(card),
    messages: [
      ...prev.messages,
      { role: "user", content: userText, createdAt: now },
      {
        role: "assistant",
        content: res.reply,
        createdAt: now,
        ...(coach ? { coach } : {}),
      },
    ],
  };
}

export async function loadIdeaLabState(projectId: string): Promise<IdeaLabState> {
  const { data, error } = await supabase
    .from("projects")
    .select("idea_lab_state")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  return parseIdeaLabState((data as { idea_lab_state?: unknown } | null)?.idea_lab_state);
}

export async function saveIdeaLabState(projectId: string, state: IdeaLabState): Promise<void> {
  const clarityPercent = calculateClarityPercent(state.card);
  const payload: IdeaLabState = { ...state, clarityPercent };
  const { error } = await supabase
    .from("projects")
    .update({
      idea_lab_state: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (error) throw error;
}

export async function applyChatResponse(
  projectId: string,
  prev: IdeaLabState,
  userText: string,
  res: IdeaLabChatResponse,
): Promise<IdeaLabState> {
  const next = applyChatResponseLocal(prev, userText, res);
  await saveIdeaLabState(projectId, next);
  return next;
}
