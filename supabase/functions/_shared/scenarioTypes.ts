export type BriefQuestionType = "text" | "textarea" | "select" | "number" | "url";

export type BriefQuestion = {
  id: string;
  label: string;
  placeholder: string;
  helperText: string;
  type: BriefQuestionType;
  required: boolean;
  options?: { value: string; label: string }[];
};

export type LandingBlockStructure = {
  id: string;
  title: string;
  goal: string;
};

export type LandingScenario = {
  id: string;
  title: string;
  shortDescription: string;
  goal: string;
  logic: string;
  primaryCTA: string;
  copywritingStyle: string;
  briefIntro: string;
  questions: BriefQuestion[];
  landingStructure: LandingBlockStructure[];
};

export type ScenarioSnapshot = Pick<
  LandingScenario,
  "id" | "title" | "goal" | "logic" | "primaryCTA"
> & {
  landingStructure?: LandingBlockStructure[];
};

export type ScenarioBriefPayload = {
  scenario_id: string;
  answers: Record<string, string>;
  competitor_url?: string;
  own_site_url?: string;
};
