import type { ForgeGenerationPromptConfig } from "./generationPrompts";

export type ForgeProductStatus = "active" | "archived";

export type ForgeProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: ForgeProductStatus;
  generation_prompts?: ForgeGenerationPromptConfig;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ForgeStudioPortal = {
  id: string;
  token: string;
  product_id: string;
  title: string;
  subtitle: string | null;
  allowed_templates: string[];
  allowed_scenarios: string[];
  allowed_direction_slugs: string[] | null;
  allowed_formats: string[];
  max_generations_per_day: number;
  generations_today: number;
  generations_day: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ForgeKbProduct = {
  category?: string;
  price_range?: string;
  mechanism?: string;
  what_it_does?: string;
  why_it_works?: string;
  delivery?: string;
};

export type ForgeKbAudience = {
  primary?: string;
  jobs_to_be_done?: string;
  awareness_stage?: string;
  segments?: string[];
};

export type ForgeKbUsp = {
  one_liner?: string;
  differentiators?: string[];
  category_alternative?: string;
};

export type ForgeKbPain = {
  text: string;
  weight?: number;
  emotional_trigger?: string;
};

export type ForgeKbFabRow = {
  feature: string;
  advantage: string;
  benefit: string;
};

export type ForgeKbObjection = {
  text: string;
  answer?: string;
};

export type ForgeKbProof = {
  type: "case" | "metric" | "screenshot" | "logo" | "media";
  title: string;
  body?: string;
  url?: string;
};

export type ForgeKbCompetitor = {
  name: string;
  url?: string;
  difference?: string;
};

export type ForgeKbOffer = {
  name: string;
  price?: string;
  features?: string[];
  cta?: string;
};

export type ForgeKbTone = {
  voice?: string;
  forbidden_words?: string[];
  style_examples?: string[];
};

export type ForgeKbAsset = {
  type: "image" | "video";
  url: string;
  alt?: string;
  tag?: string;
};

export type ForgeSourceDocument = {
  id: string;
  filename: string;
  text: string;
  char_count: number;
  uploaded_at: string;
  /** null / omitted = общая база продукта */
  direction_slug?: string | null;
};

export type ForgeReferenceSite = {
  id: string;
  url: string;
  label?: string;
  note?: string;
  scraped_text?: string;
  meaning_notes?: string;
  added_at: string;
  direction_slug?: string | null;
};

export type ForgeDirection = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  kb: {
    audience?: ForgeKbAudience;
    usp?: ForgeKbUsp;
    pains?: ForgeKbPain[];
    voc?: string[];
    objections?: ForgeKbObjection[];
    proofs?: ForgeKbProof[];
  };
  updated_at: string;
};

export type ForgeKnowledgeBase = {
  id: string;
  product_id: string;
  product: ForgeKbProduct;
  audience: ForgeKbAudience;
  usp: ForgeKbUsp;
  pains: ForgeKbPain[];
  voc: string[];
  fab_matrix: ForgeKbFabRow[];
  objections: ForgeKbObjection[];
  proofs: ForgeKbProof[];
  competitors: ForgeKbCompetitor[];
  offers: ForgeKbOffer[];
  tone: ForgeKbTone;
  assets: ForgeKbAsset[];
  source_documents: ForgeSourceDocument[];
  reference_sites: ForgeReferenceSite[];
  directions: ForgeDirection[];
  completion_percent: number;
  updated_at: string;
};

export type ForgeRsyaOffer = {
  segment: string;
  angle: string;
  title: string;
  text: string;
  cta: string;
  image_brief?: string;
  landing_hook?: string;
  proof_or_limit?: string;
  compliance_note?: string;
};

export type ForgeRsyaOffersResult = {
  meta?: {
    product_name?: string;
    direction?: string;
    prototype_name?: string;
    landing_target?: string;
    target_action?: string;
    core_positioning?: string;
  };
  offers: ForgeRsyaOffer[];
};

export type ForgeReview = {
  id: string;
  product_id: string;
  source: string | null;
  author: string | null;
  rating: number | null;
  text: string;
  tags: string[];
  is_starred: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ForgeTemplateFormat = "long-form" | "funnel" | "interactive";

export type ForgeTemplateStep = {
  key: string;
  label: string;
  blocks: string[];
};

export type ForgeTemplate = {
  id: string;
  title: string;
  description: string | null;
  format: ForgeTemplateFormat;
  blocks: string[];
  steps: ForgeTemplateStep[] | null;
  constraints: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
};

export type ForgePrototypeStatus = "draft" | "published" | "archived";

export type ForgePrototype = {
  id: string;
  product_id: string;
  template_id: string;
  scenario_id: string | null;
  direction_slug: string | null;
  name: string;
  slug: string | null;
  status: ForgePrototypeStatus;
  active_version_id: string | null;
  meta: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type ForgePrototypeVersion = {
  id: string;
  prototype_id: string;
  version: number;
  content: Record<string, unknown>;
  generation_input: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
};

export type ForgeLeadStatus = "new" | "contacted" | "qualified" | "closed" | "spam";

export type ForgeLead = {
  id: string;
  prototype_id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  source_step: string | null;
  utm: Record<string, unknown> | null;
  status: ForgeLeadStatus;
  created_at: string;
};

export type ForgeClipMeta = {
  project_name?: string;
  target_action?: string;
  tone_of_voice?: string;
  support_phone?: string;
  live_readers_hint?: number;
};

/** Контент прототипа после генерации (упрощённая схема — расширится по мере шаблонов). */
export type ForgePrototypeContent = {
  meta?: ForgeClipMeta & {
    sequence?: string[];
  };
  /** Для template='full' — используется существующая схема generate-prototype. */
  blocks?: Record<string, unknown>;
  /** Для template='clip-4' — 4 шага по очереди. */
  steps?: ForgeClipStepContent[];
};

export type ForgeClipStepContent = {
  key: string;
  label: string;
  hero?: {
    headline: string;
    subheadline?: string;
    badge?: string;
  };
  pain?: { title: string; points: string[] };
  pain_escalation?: { headline: string; body: string };
  old_loop?: { title: string; items: string[] };
  mechanism?: { title: string; body: string };
  benefits?: { title: string; items: string[] };
  paradigm_shift?: { headline: string; old_belief: string; new_belief: string; bridge?: string };
  story?: { headline: string; body: string; author?: string; result?: string };
  social_proof?: {
    title: string;
    items: { quote: string; author: string; role?: string }[];
  };
  metrics?: {
    title: string;
    items: { number: string; label: string }[];
  };
  who_for?: {
    title: string;
    for_items: string[];
    not_for_items?: string[];
  };
  guarantee?: { headline: string; body?: string };
  micro_trust?: { items: string[] };
  objections?: { items: { question: string; answer: string }[] };
  lead_form_personal?: {
    headline: string;
    subheadline?: string;
    persona_name?: string;
    persona_role?: string;
    persona_status?: string;
    cta: string;
    consent_text: string;
    fields: { id: "name" | "phone" | "email"; placeholder: string }[];
  };
  cta?: {
    label: string;
    next_step?: string;
  };
};
