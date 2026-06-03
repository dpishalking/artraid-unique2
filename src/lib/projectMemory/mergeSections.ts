import type { ProjectMemorySections } from "./types";
import {
  emptyAudienceSection,
  emptyBusinessMetricsSection,
  emptyCompanySection,
  emptyConstraintsSection,
  emptyFounderSection,
  emptyOfferPositioningSection,
  emptyPainsDesiresSection,
  emptyPricingSection,
  emptyProductSection,
  emptyProofsSection,
  emptyToneSection,
  emptyWebsitesSection,
} from "./defaults";

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function mergeNested<T extends Record<string, unknown>>(raw: unknown, empty: () => T): T {
  const base = empty();
  const incoming = asObj(raw);
  const out = { ...base } as Record<string, unknown>;
  for (const k of Object.keys(base)) {
    const bv = base[k];
    const iv = incoming[k];
    if (Array.isArray(bv)) {
      out[k] = Array.isArray(iv) ? [...iv] : bv;
      continue;
    }
    const use =
      iv == null
        ? bv
        : typeof iv === "string" || typeof iv === "number" || typeof iv === "boolean"
          ? iv
          : bv;
    out[k] = use;
  }
  return out as T;
}

function mergeCompetitors(raw: unknown): ProjectMemorySections["competitors"] {
  return Array.isArray(raw) ? (raw as ProjectMemorySections["competitors"]) : [];
}

function mergeObjections(raw: unknown): ProjectMemorySections["objections"] {
  return Array.isArray(raw) ? (raw as ProjectMemorySections["objections"]) : [];
}

/** Строку из Supabase превращает в связный объект секций. */
export function mergeStoredMemoryIntoSections(
  row: Partial<Record<keyof ProjectMemorySections | string, unknown>>,
): ProjectMemorySections {
  return {
    company: mergeNested(row.company, emptyCompanySection),
    founder: mergeNested(row.founder, emptyFounderSection),
    product: mergeNested(row.product, emptyProductSection),
    audience: mergeNested(row.audience, emptyAudienceSection),
    pains_desires: mergeNested(row.pains_desires, emptyPainsDesiresSection),
    offer_positioning: mergeNested(row.offer_positioning, emptyOfferPositioningSection),
    websites: mergeNested(row.websites, emptyWebsitesSection),
    competitors: mergeCompetitors(row.competitors),
    proofs: mergeNested(row.proofs, emptyProofsSection),
    objections: mergeObjections(row.objections),
    pricing: mergeNested(row.pricing, emptyPricingSection),
    business_metrics: mergeNested(row.business_metrics, emptyBusinessMetricsSection),
    tone: mergeNested(row.tone, emptyToneSection),
    constraints: mergeNested(row.constraints, emptyConstraintsSection),
  };
}
