/** Типы «Память проекта» (JSON в project_memories). */

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/** Конкурент в памяти проекта (расширенная запись) */
export type MemoryCompetitor = {
  name?: string;
  url?: string;
  positioning?: string;
  strengths?: string[];
  weaknesses?: string[];
  notes?: string;
};

export type ObjectionEntry = {
  objection: string;
  answer?: string;
  proof?: string;
};

export type CompanySection = {
  company_name?: string;
  company_description?: string;
  company_website?: string;
  company_location?: string;
  company_stage?: string;
  company_industry?: string;
  company_size?: string;
  company_mission?: string;
  company_advantages?: string[];
};

export type FounderSection = {
  founder_name?: string;
  founder_role?: string;
  founder_bio?: string;
  founder_expertise?: string;
  founder_story?: string;
  founder_credentials?: string;
  founder_media?: string;
  founder_social_links?: string;
};

export type ProductSection = {
  product_name?: string;
  product_description?: string;
  product_category?: string;
  product_format?: string;
  product_price_range?: string;
  product_delivery_method?: string;
  product_core_result?: string;
  product_unique_mechanism?: string;
  product_features?: string[];
  product_benefits?: string[];
  product_limitations?: string;
};

export type AudienceSection = {
  target_audience?: string;
  audience_segments?: string[];
  best_customers?: string;
  worst_customers?: string;
  customer_situation?: string;
  customer_awareness_level?: string;
  decision_maker?: string;
  buying_triggers?: string;
};

export type PainsDesiresSection = {
  main_pain?: string;
  secondary_pains?: string[];
  hidden_pains?: string;
  main_desire?: string;
  desired_outcomes?: string[];
  jobs_to_be_done?: string;
  fears?: string;
  frustrations?: string;
  alternatives?: string;
};

export type OfferPositioningSection = {
  current_offer?: string;
  key_promise?: string;
  positioning?: string;
  unique_selling_proposition?: string;
  differentiation?: string;
  guarantee?: string;
  urgency_reason?: string;
  call_to_action?: string;
  offer_weaknesses?: string;
  offer_strengths?: string;
};

export type WebsitesSection = {
  main_website_url?: string;
  landing_urls?: string[];
  previous_landing_versions?: string;
  current_landing_goal?: string;
  current_landing_problem?: string;
  analytics_links?: string;
  important_pages?: string;
};

export type ProofsSection = {
  testimonials?: string;
  cases?: string;
  numbers?: string;
  certificates?: string;
  media_mentions?: string;
  client_logos?: string[];
  before_after?: string;
  expert_proofs?: string;
  social_proof?: string;
  trust_assets?: string;
};

export type PricingSection = {
  pricing_model?: string;
  price_points?: string;
  packages?: string;
  payment_options?: string;
  discounts?: string;
  refund_policy?: string;
  comparison_with_alternatives?: string;
};

export type BusinessMetricsSection = {
  monthly_revenue?: string;
  average_check?: string;
  target_sales?: string;
  current_sales?: string;
  conversion_rate?: string;
  lead_to_sale_conversion?: string;
  traffic_sources?: string;
  ad_spend?: string;
  cpl?: string;
  cpa?: string;
  roas?: string;
  business_goal?: string;
};

export type ToneSection = {
  tone_of_voice?: string;
  forbidden_phrases?: string;
  preferred_phrases?: string;
  brand_style?: string;
  examples_of_good_copy?: string;
  examples_of_bad_copy?: string;
};

export type ConstraintsSection = {
  legal_constraints?: string;
  medical_or_financial_disclaimers?: string;
  compliance_notes?: string;
  geography_limits?: string;
  operational_limits?: string;
  things_not_to_say?: string;
  important_notes?: string;
};

export type ProjectMemorySections = {
  company: CompanySection;
  founder: FounderSection;
  product: ProductSection;
  audience: AudienceSection;
  pains_desires: PainsDesiresSection;
  offer_positioning: OfferPositioningSection;
  websites: WebsitesSection;
  competitors: MemoryCompetitor[];
  proofs: ProofsSection;
  objections: ObjectionEntry[];
  pricing: PricingSection;
  business_metrics: BusinessMetricsSection;
  tone: ToneSection;
  constraints: ConstraintsSection;
};

export type MemoryCompletionLevelSlug = "empty" | "basic" | "understood" | "strong_base" | "deep";

export type ProjectMemoryRow = ProjectMemorySections & {
  id: string;
  project_id: string;
  completion_percent: number;
  completion_level: MemoryCompletionLevelSlug | string;
  badges: string[];
  created_at: string;
  updated_at: string;
};

export type ProjectMemorySnapshot = ProjectMemorySections & {
  completion_percent: number;
  completion_level: MemoryCompletionLevelSlug | string;
  badges: string[];
};

export const BADGE_IDS = {
  PROJECT_START: "project_start",
  BASE_COLLECTED: "base_collected",
  OFFER_CLEAR: "offer_clear",
  MARKET_ADDED: "market_added",
  TRUST_COLLECTED: "trust_collected",
  OBJECTIONS_ACCOUNTED: "objections_accounted",
  PROTOTYPE_READY: "prototype_ready",
  DEEP_MEMORY: "deep_memory",
} as const;

export type SectionNavId =
  | "company"
  | "founder"
  | "product"
  | "audience"
  | "pains_desires"
  | "offer_positioning"
  | "websites"
  | "competitors"
  | "proofs"
  | "objections"
  | "pricing"
  | "business_metrics"
  | "tone"
  | "constraints";
