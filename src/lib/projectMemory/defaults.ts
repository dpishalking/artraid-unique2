import type {
  AudienceSection,
  BusinessMetricsSection,
  CompanySection,
  ConstraintsSection,
  FounderSection,
  OfferPositioningSection,
  PainsDesiresSection,
  PricingSection,
  ProductSection,
  ProjectMemorySections,
  ProofsSection,
  ToneSection,
  WebsitesSection,
} from "./types";

export function emptyCompanySection(): CompanySection {
  return {
    company_name: "",
    company_description: "",
    company_website: "",
    company_location: "",
    company_stage: "",
    company_industry: "",
    company_size: "",
    company_mission: "",
    company_advantages: [],
  };
}

export function emptyFounderSection(): FounderSection {
  return {
    founder_name: "",
    founder_role: "",
    founder_bio: "",
    founder_expertise: "",
    founder_story: "",
    founder_credentials: "",
    founder_media: "",
    founder_social_links: "",
  };
}

export function emptyProductSection(): ProductSection {
  return {
    product_name: "",
    product_description: "",
    product_category: "",
    product_format: "",
    product_price_range: "",
    product_delivery_method: "",
    product_core_result: "",
    product_unique_mechanism: "",
    product_features: [],
    product_benefits: [],
    product_limitations: "",
  };
}

export function emptyAudienceSection(): AudienceSection {
  return {
    target_audience: "",
    audience_segments: [],
    best_customers: "",
    worst_customers: "",
    customer_situation: "",
    customer_awareness_level: "",
    decision_maker: "",
    buying_triggers: "",
  };
}

export function emptyPainsDesiresSection(): PainsDesiresSection {
  return {
    main_pain: "",
    secondary_pains: [],
    hidden_pains: "",
    main_desire: "",
    desired_outcomes: [],
    jobs_to_be_done: "",
    fears: "",
    frustrations: "",
    alternatives: "",
  };
}

export function emptyOfferPositioningSection(): OfferPositioningSection {
  return {
    current_offer: "",
    key_promise: "",
    positioning: "",
    unique_selling_proposition: "",
    differentiation: "",
    guarantee: "",
    urgency_reason: "",
    call_to_action: "",
    offer_weaknesses: "",
    offer_strengths: "",
  };
}

export function emptyWebsitesSection(): WebsitesSection {
  return {
    main_website_url: "",
    landing_urls: [],
    previous_landing_versions: "",
    current_landing_goal: "",
    current_landing_problem: "",
    analytics_links: "",
    important_pages: "",
  };
}

export function emptyProofsSection(): ProofsSection {
  return {
    testimonials: "",
    cases: "",
    numbers: "",
    certificates: "",
    media_mentions: "",
    client_logos: [],
    before_after: "",
    expert_proofs: "",
    social_proof: "",
    trust_assets: "",
  };
}

export function emptyPricingSection(): PricingSection {
  return {
    pricing_model: "",
    price_points: "",
    packages: "",
    payment_options: "",
    discounts: "",
    refund_policy: "",
    comparison_with_alternatives: "",
  };
}

export function emptyBusinessMetricsSection(): BusinessMetricsSection {
  return {
    monthly_revenue: "",
    average_check: "",
    target_sales: "",
    current_sales: "",
    conversion_rate: "",
    lead_to_sale_conversion: "",
    traffic_sources: "",
    ad_spend: "",
    cpl: "",
    cpa: "",
    roas: "",
    business_goal: "",
  };
}

export function emptyToneSection(): ToneSection {
  return {
    tone_of_voice: "",
    forbidden_phrases: "",
    preferred_phrases: "",
    brand_style: "",
    examples_of_good_copy: "",
    examples_of_bad_copy: "",
  };
}

export function emptyConstraintsSection(): ConstraintsSection {
  return {
    legal_constraints: "",
    medical_or_financial_disclaimers: "",
    compliance_notes: "",
    geography_limits: "",
    operational_limits: "",
    things_not_to_say: "",
    important_notes: "",
  };
}

export function emptyProjectMemorySections(): ProjectMemorySections {
  return {
    company: emptyCompanySection(),
    founder: emptyFounderSection(),
    product: emptyProductSection(),
    audience: emptyAudienceSection(),
    pains_desires: emptyPainsDesiresSection(),
    offer_positioning: emptyOfferPositioningSection(),
    websites: emptyWebsitesSection(),
    competitors: [],
    proofs: emptyProofsSection(),
    objections: [],
    pricing: emptyPricingSection(),
    business_metrics: emptyBusinessMetricsSection(),
    tone: emptyToneSection(),
    constraints: emptyConstraintsSection(),
  };
}
