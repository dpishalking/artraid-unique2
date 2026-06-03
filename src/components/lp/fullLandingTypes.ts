/** Block shapes for full-template public landing (matches generate-prototype schema). */

export type FullLandingBlocks = {
  hero?: {
    headline: string;
    headline_variants?: string[];
    subheadline: string;
    cta: string;
    trust: string[];
    note?: string;
    story_opening?: string;
    story_bridge?: string;
  };
  paradigm_shift?: {
    headline: string;
    old_belief: string;
    new_belief: string;
    bridge: string;
    transition_hook?: string;
    note?: string;
  };
  pain?: { title: string; intro?: string; points: string[]; transition_hook?: string; note?: string };
  enemy_section?: {
    headline: string;
    enemy_name: string;
    how_enemy_works: string;
    proof: string;
    transition_hook?: string;
    note?: string;
  };
  solution?: {
    title: string;
    steps: { title: string; desc: string }[];
    transition_hook?: string;
    note?: string;
  };
  transformation?: {
    headline: string;
    before: string[];
    after: string[];
    timeline: string;
    note?: string;
  };
  value?: {
    title: string;
    metrics: { number: string; label: string; loss_framing?: string; fascination?: string }[];
    note?: string;
  };
  product?: {
    title: string;
    anchor_context?: string;
    tiers: { name: string; price: string; description?: string; features: string[]; cta?: string }[];
    note?: string;
  };
  process?: {
    title: string;
    steps: { title: string; desc: string; duration?: string }[];
    note?: string;
  };
  founder?: {
    headline: string;
    story: string;
    credentials: string[];
    why_this: string;
    transition_hook?: string;
    note?: string;
  };
  comparison?: {
    title: string;
    us_label: string;
    them_label: string;
    differentiation_angle?: string;
    rows: { feature: string; us: string; them: string }[];
    note?: string;
  };
  social_proof?: {
    title: string;
    items: { quote: string; author: string; role: string; result?: string; before_state?: string }[];
    note?: string;
  };
  not_for?: { title: string; intro?: string; points: string[]; note?: string };
  objections?: {
    title: string;
    items: { objection: string; answer: string; reframe?: string; frequency?: string }[];
    note?: string;
  };
  faq?: { title: string; items: { q: string; a: string }[]; note?: string };
  future_pacing?: {
    headline: string;
    scene: string;
    emotions: string;
    contrast: string;
    note?: string;
  };
  guarantee?: {
    headline: string;
    type: string;
    duration: string;
    conditions: string;
    emotional_hook: string;
    note?: string;
  };
  final_cta?: {
    headline: string;
    subheadline: string;
    cta: string;
    urgency?: string;
    risk_reversal?: string;
    note?: string;
  };
  micro_copy?: {
    form_placeholder?: string;
    form_submit?: string;
    form_success?: string;
    trust_badge?: string;
    nav_cta?: string;
    hero_badge?: string;
  };
};

export type FullLandingContent = {
  meta?: {
    project_name?: string;
    tone_of_voice?: string;
    target_action?: string;
    sequence?: string[];
    sequence_rationale?: string;
  };
  blocks?: FullLandingBlocks;
};

const ALL_BLOCK_KEYS = [
  "hero",
  "paradigm_shift",
  "pain",
  "enemy_section",
  "solution",
  "transformation",
  "value",
  "product",
  "process",
  "founder",
  "comparison",
  "social_proof",
  "not_for",
  "objections",
  "faq",
  "future_pacing",
  "guarantee",
  "final_cta",
] as const;

export function buildFullLandingSequence(sequence?: string[]): string[] {
  const valid = new Set<string>(ALL_BLOCK_KEYS);
  const base = (sequence?.length ? sequence : [...ALL_BLOCK_KEYS]).filter((k) => valid.has(k));
  const middle = base.filter((k) => k !== "hero" && k !== "final_cta");
  return ["hero", ...middle, "final_cta"];
}
