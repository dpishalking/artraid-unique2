export type OfferPurpose =
  | "landing_hero"
  | "post"
  | "ad"
  | "stories_reels"
  | "email"
  | "telegram_bot"
  | "consultation"
  | "webinar"
  | "lead_magnet"
  | "commercial_proposal"
  | "presentation"
  | "service"
  | "product"
  | "custom";

export type OfferTone =
  | "expert"
  | "calm"
  | "premium"
  | "conversational"
  | "bold"
  | "provocative"
  | "empathetic"
  | "inspiring"
  | "formal"
  | "playful";

export interface OfferBrief {
  offerPurpose: OfferPurpose;
  customPurpose?: string;
  productDescription: string;
  targetAudience: string;
  customerSituation: string;
  painPoint: string;
  promisedResult: string;
  proof: string;
  objections: string;
  additionalContext: string;
  tone: OfferTone;
}

export interface OfferFourUItem {
  score: number;
  comment: string;
}

export interface OfferStrategy {
  awarenessStage?: string;
  sophisticationLevel?: number;
  bigIdea?: string;
  enemy?: string;
  mechanism?: string;
  leadType?: string;
  voicePhrases?: string[];
}

export interface OfferResult {
  bestOffer: {
    headline: string;
    subheadline: string;
    cta: string;
    microcopy: string;
  };
  strategy?: OfferStrategy;
  whyItWorks: string[];
  angles: {
    pain: string;
    result: string;
    loss: string;
    enemy: string;
    mechanism: string;
    diagnostic: string;
    urgency: string;
  };
  formatVersions: {
    landing?: {
      headline: string;
      subheadline: string;
      cta: string;
      microcopy: string;
    };
    post?: {
      hook: string;
      body: string;
      cta: string;
    };
    ad?: {
      primaryText: string;
      headline: string;
      description: string;
      cta: string;
    };
    stories?: {
      slide1: string;
      slide2: string;
      slide3: string;
      slide4: string;
    };
    email?: {
      subject: string;
      preview: string;
      opening: string;
      cta: string;
    };
  };
  fourUScore: {
    useful: OfferFourUItem;
    urgent: OfferFourUItem;
    unique: OfferFourUItem;
    ultraSpecific: OfferFourUItem;
  };
  improvements: string[];
  alternativeHeadlines: string[];
  alternativeCtas: string[];
}

export interface OfferRewriteResult {
  diagnosis: string[];
  weakPoints: string[];
  improvedOffers: {
    headline: string;
    subheadline: string;
    cta: string;
    microcopy: string;
  }[];
  bestVersionIndex: number;
  fourUScore: OfferResult["fourUScore"];
}

export const EMPTY_BRIEF: OfferBrief = {
  offerPurpose: "landing_hero",
  customPurpose: "",
  productDescription: "",
  targetAudience: "",
  customerSituation: "",
  painPoint: "",
  promisedResult: "",
  proof: "",
  objections: "",
  additionalContext: "",
  tone: "expert",
};
