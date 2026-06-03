import { calculateClarityPercent } from "./clarity";
import { normalizeCoachRole } from "./roles";
import type {
  CoachProposal,
  IdeaLabCard,
  IdeaLabCoachMeta,
  IdeaLabServiceHandoff,
  IdeaLabState,
  IdeaLabStageId,
  IdeaLabTurnMode,
} from "./types";
import { DEFAULT_IDEA_LAB_STATE } from "./types";

function parseCoachMeta(raw: unknown): IdeaLabCoachMeta | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const coach: IdeaLabCoachMeta = {};
  if (typeof o.insight === "string" && o.insight.trim()) coach.insight = o.insight.trim();
  if (typeof o.interim_summary === "string" && o.interim_summary.trim()) {
    coach.interim_summary = o.interim_summary.trim();
  }
  if (Array.isArray(o.assumptions)) {
    coach.assumptions = o.assumptions.map((a) => String(a).trim()).filter(Boolean).slice(0, 2);
  }
  if (Array.isArray(o.proposals)) {
    coach.proposals = o.proposals
      .filter((p) => p && typeof p === "object")
      .map((p) => {
        const x = p as Record<string, unknown>;
        return {
          title: String(x.title ?? "").trim(),
          for_who: String(x.for_who ?? "").trim(),
          promise: String(x.promise ?? "").trim(),
          format: String(x.format ?? "").trim(),
        } satisfies CoachProposal;
      })
      .filter((p) => p.title.length >= 2 && p.promise.length >= 4)
      .slice(0, 3);
  }
  const modes: IdeaLabTurnMode[] = ["explore", "clarify", "summarize", "handoff"];
  if (typeof o.turn_mode === "string" && modes.includes(o.turn_mode as IdeaLabTurnMode)) {
    coach.turn_mode = o.turn_mode as IdeaLabTurnMode;
  }
  if (o.handoff && typeof o.handoff === "object") {
    const h = o.handoff as Record<string, unknown>;
    const service = String(h.service ?? "");
    if (["offer_generator", "prototype", "audit", "quiz"].includes(service)) {
      const label = String(h.label ?? "").trim();
      const reason = String(h.reason ?? "").trim();
      if (label && reason) {
        coach.handoff = {
          service: service as IdeaLabServiceHandoff["service"],
          purpose: typeof h.purpose === "string" ? h.purpose : undefined,
          label,
          reason,
        };
      }
    }
  }
  return Object.keys(coach).length > 0 ? coach : undefined;
}

export function formatProposalPick(proposal: CoachProposal): string {
  return `Ближе вариант «${proposal.title}»: для ${proposal.for_who}. Обещание: ${proposal.promise}. Формат: ${proposal.format}.`;
}

export function parseIdeaLabState(raw: unknown): IdeaLabState {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_IDEA_LAB_STATE, messages: [] };
  const o = raw as Record<string, unknown>;
  const base = { ...DEFAULT_IDEA_LAB_STATE, messages: [] as IdeaLabState["messages"] };
  if (typeof o.stage === "string") base.stage = o.stage as IdeaLabStageId;
  if (Array.isArray(o.messages)) {
    base.messages = o.messages
      .filter((m) => m && typeof m === "object")
      .map((m) => {
        const x = m as Record<string, unknown>;
        const coach = parseCoachMeta(x.coach);
        return {
          role: x.role === "user" ? "user" : "assistant",
          content: String(x.content ?? ""),
          createdAt: x.createdAt ? String(x.createdAt) : undefined,
          ...(coach ? { coach } : {}),
        };
      });
  }
  if (o.card && typeof o.card === "object") {
    base.card = { ...(o.card as IdeaLabCard) };
  }
  base.clarityPercent =
    typeof o.clarityPercent === "number"
      ? o.clarityPercent
      : calculateClarityPercent(base.card);
  if (typeof o.completedAt === "string") base.completedAt = o.completedAt;
  if (o.coachRole) base.coachRole = normalizeCoachRole(o.coachRole);
  return base;
}

export function mergeCard(prev: IdeaLabCard, patch: Partial<IdeaLabCard>): IdeaLabCard {
  const next = { ...prev };
  for (const [k, v] of Object.entries(patch)) {
    if (typeof v === "string" && v.trim()) {
      (next as Record<string, string>)[k] = v.trim();
    }
  }
  return next;
}
