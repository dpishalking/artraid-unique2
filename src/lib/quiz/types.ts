import type { MainGoal } from "@/lib/projects/types";
import type { StartupMode } from "@/lib/ideaLab/types";

export type QuizDraft = {
  startupMode: StartupMode;
  productDescription: string;
  productName?: string;
  targetAudience: string;
  mainGoal: MainGoal;
  website?: string;
};

export type QuizStepId =
  | "intro"
  | "situation"
  | "product"
  | "audience"
  | "goal"
  | "website"
  | "register"
  | "building";
