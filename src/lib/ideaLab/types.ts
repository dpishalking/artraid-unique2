export type StartupMode = "has_business" | "has_idea" | "find_idea";

export type IdeaLabCoachRole = "coach" | "investor" | "critic";

export type IdeaLabStageId =
  | "idea"
  | "problem"
  | "audience"
  | "value"
  | "format"
  | "validation"
  | "offer"
  | "actions";

export type CoachProposal = {
  title: string;
  for_who: string;
  promise: string;
  format: string;
};

export type IdeaLabTurnMode = "explore" | "clarify" | "summarize" | "handoff";

export type IdeaLabServiceHandoff = {
  service: "offer_generator" | "prototype" | "audit" | "quiz";
  purpose?: string;
  label: string;
  reason: string;
};

export type IdeaLabCoachMeta = {
  insight?: string;
  interim_summary?: string;
  assumptions?: string[];
  proposals?: CoachProposal[];
  turn_mode?: IdeaLabTurnMode;
  handoff?: IdeaLabServiceHandoff;
};

export type IdeaLabMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
  coach?: IdeaLabCoachMeta;
};

export type IdeaLabCard = {
  idea_name?: string;
  short_description?: string;
  target_audience?: string;
  main_problem?: string;
  desired_outcome?: string;
  product_format?: string;
  primary_offer?: string;
  mvp?: string;
  demand_hypotheses?: string;
  next_step?: string;
};

export type IdeaLabState = {
  version: 1;
  stage: IdeaLabStageId;
  messages: IdeaLabMessage[];
  card: IdeaLabCard;
  clarityPercent: number;
  coachRole?: IdeaLabCoachRole;
  completedAt?: string;
};

export const EMPTY_IDEA_LAB_CARD: IdeaLabCard = {};

export const DEFAULT_IDEA_LAB_STATE: IdeaLabState = {
  version: 1,
  stage: "idea",
  messages: [],
  card: {},
  clarityPercent: 0,
};
