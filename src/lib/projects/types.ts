export type ProjectStatus = "active" | "archived" | "deleted";

export type CompetitorEntry = {
  name?: string;
  url: string;
  notes?: string;
};

export type MainGoal =
  | "strengthen_offer"
  | "increase_conversion"
  | "compare_competitors"
  | "new_prototype"
  | "find_weak_points"
  | "test_hypothesis"
  | "new_launch";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  product_name: string | null;
  product_description: string;
  current_website_url: string | null;
  target_audience: string;
  main_goal: string;
  current_offer: string | null;
  competitors: CompetitorEntry[];
  additional_context: string | null;
  status: ProjectStatus;
  packaging_score: number | null;
  quiz_completed: boolean;
  quiz_answers_snapshot: Record<string, unknown> | null;
  quiz_synced_at: string | null;
  quiz_memory_mapped_fields: string[];
  startup_mode: string;
  idea_lab_state: Record<string, unknown>;
  onboarding_state: Record<string, unknown>;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
};

export type ProjectContext = {
  id: string;
  project_id: string;
  product_name: string | null;
  product_description: string | null;
  market_category: string | null;
  target_audience: string | null;
  audience_segments: string[];
  main_pain: string | null;
  secondary_pains: string[];
  main_desire: string | null;
  desired_outcomes: string[];
  current_offer: string | null;
  key_promise: string | null;
  positioning: string | null;
  unique_mechanism: string | null;
  price_range: string | null;
  current_website_url: string | null;
  competitors: CompetitorEntry[];
  key_proofs: string[];
  objections: string[];
  tone_of_voice: string | null;
  constraints: string | null;
  previous_attempts: string | null;
  important_notes: string | null;
  missing_data: string[];
  recommended_next_step: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectEvent = {
  id: string;
  project_id: string;
  user_id: string | null;
  event_type: string;
  title: string;
  description: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type CreateProjectInput = {
  name: string;
  product_name?: string;
  product_description: string;
  current_website_url?: string;
  target_audience: string;
  main_goal: MainGoal | string;
  current_offer?: string;
  competitors?: CompetitorEntry[];
  additional_context?: string;
  startup_mode?: "has_business" | "has_idea" | "find_idea";
};

export type ProjectWithContext = {
  project: Project;
  context: ProjectContext | null;
};
