import type { CompetitorEntry, Project, ProjectContext } from "./types";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

export function parseCompetitors(v: unknown): CompetitorEntry[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const url = String(o.url ?? "").trim();
      if (!url) return null;
      return {
        url,
        name: o.name ? String(o.name) : undefined,
        notes: o.notes ? String(o.notes) : undefined,
      };
    })
    .filter((x): x is CompetitorEntry => x !== null);
}

export function normalizeProject(row: Record<string, unknown>): Project {
  const mappedQuizFields = row.quiz_memory_mapped_fields;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    product_name: row.product_name ? String(row.product_name) : null,
    product_description: String(row.product_description),
    current_website_url: row.current_website_url ? String(row.current_website_url) : null,
    target_audience: String(row.target_audience),
    main_goal: String(row.main_goal),
    current_offer: row.current_offer ? String(row.current_offer) : null,
    competitors: parseCompetitors(row.competitors),
    additional_context: row.additional_context ? String(row.additional_context) : null,
    status: String(row.status ?? "active") as Project["status"],
    packaging_score:
      typeof row.packaging_score === "number" ? row.packaging_score : null,
    quiz_completed: typeof row.quiz_completed === "boolean" ? row.quiz_completed : false,
    quiz_answers_snapshot:
      row.quiz_answers_snapshot && typeof row.quiz_answers_snapshot === "object"
        ? (row.quiz_answers_snapshot as Record<string, unknown>)
        : null,
    quiz_synced_at: row.quiz_synced_at ? String(row.quiz_synced_at) : null,
    quiz_memory_mapped_fields: Array.isArray(mappedQuizFields)
      ? mappedQuizFields.map((x) => String(x)).filter(Boolean)
      : [],
    startup_mode: String(row.startup_mode ?? "has_business"),
    idea_lab_state:
      row.idea_lab_state && typeof row.idea_lab_state === "object"
        ? (row.idea_lab_state as Record<string, unknown>)
        : {},
    onboarding_state:
      row.onboarding_state && typeof row.onboarding_state === "object"
        ? (row.onboarding_state as Record<string, unknown>)
        : {},
    onboarding_completed_at: row.onboarding_completed_at
      ? String(row.onboarding_completed_at)
      : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    last_activity_at: String(row.last_activity_at ?? row.created_at),
  };
}

export function normalizeContext(row: Record<string, unknown>): ProjectContext {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    product_name: row.product_name ? String(row.product_name) : null,
    product_description: row.product_description ? String(row.product_description) : null,
    market_category: row.market_category ? String(row.market_category) : null,
    target_audience: row.target_audience ? String(row.target_audience) : null,
    audience_segments: asStringArray(row.audience_segments),
    main_pain: row.main_pain ? String(row.main_pain) : null,
    secondary_pains: asStringArray(row.secondary_pains),
    main_desire: row.main_desire ? String(row.main_desire) : null,
    desired_outcomes: asStringArray(row.desired_outcomes),
    current_offer: row.current_offer ? String(row.current_offer) : null,
    key_promise: row.key_promise ? String(row.key_promise) : null,
    positioning: row.positioning ? String(row.positioning) : null,
    unique_mechanism: row.unique_mechanism ? String(row.unique_mechanism) : null,
    price_range: row.price_range ? String(row.price_range) : null,
    current_website_url: row.current_website_url ? String(row.current_website_url) : null,
    competitors: parseCompetitors(row.competitors),
    key_proofs: asStringArray(row.key_proofs),
    objections: asStringArray(row.objections),
    tone_of_voice: row.tone_of_voice ? String(row.tone_of_voice) : null,
    constraints: row.constraints ? String(row.constraints) : null,
    previous_attempts: row.previous_attempts ? String(row.previous_attempts) : null,
    important_notes: row.important_notes ? String(row.important_notes) : null,
    missing_data: asStringArray(row.missing_data),
    recommended_next_step: row.recommended_next_step
      ? String(row.recommended_next_step)
      : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}
