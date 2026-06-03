/** JSON Schema для Gemini: разбор исходников → структура Knowledge Base. */
export const FORGE_KB_STRUCTURE_SCHEMA = {
  type: "object",
  required: ["product", "audience", "usp", "pains", "voc", "fab_matrix", "objections", "proofs", "tone"],
  properties: {
    product: {
      type: "object",
      properties: {
        category: { type: "string" },
        mechanism: { type: "string" },
        what_it_does: { type: "string" },
        why_it_works: { type: "string" },
        price_range: { type: "string" },
        delivery: { type: "string" },
      },
    },
    audience: {
      type: "object",
      properties: {
        primary: { type: "string" },
        jobs_to_be_done: { type: "string" },
        awareness_stage: { type: "string" },
        segments: { type: "array", items: { type: "string" } },
      },
    },
    usp: {
      type: "object",
      properties: {
        one_liner: { type: "string" },
        differentiators: { type: "array", items: { type: "string" } },
        category_alternative: { type: "string" },
      },
    },
    pains: {
      type: "array",
      items: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string" },
          weight: { type: "number" },
          emotional_trigger: { type: "string" },
        },
      },
    },
    voc: { type: "array", items: { type: "string" } },
    fab_matrix: {
      type: "array",
      items: {
        type: "object",
        required: ["feature", "advantage", "benefit"],
        properties: {
          feature: { type: "string" },
          advantage: { type: "string" },
          benefit: { type: "string" },
        },
      },
    },
    objections: {
      type: "array",
      items: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string" },
          answer: { type: "string" },
        },
      },
    },
    proofs: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "title"],
        properties: {
          type: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
          url: { type: "string" },
        },
      },
    },
    tone: {
      type: "object",
      properties: {
        voice: { type: "string" },
        forbidden_words: { type: "array", items: { type: "string" } },
        style_examples: { type: "array", items: { type: "string" } },
      },
    },
    review_snippets: {
      type: "array",
      items: {
        type: "object",
        required: ["text"],
        properties: {
          text: { type: "string" },
          author: { type: "string" },
          rating: { type: "number" },
        },
      },
    },
  },
} as const;

export type ForgeKbStructureResult = {
  product?: Record<string, string | undefined>;
  audience?: Record<string, unknown>;
  usp?: Record<string, unknown>;
  pains?: Array<{ text: string; weight?: number; emotional_trigger?: string }>;
  voc?: string[];
  fab_matrix?: Array<{ feature: string; advantage: string; benefit: string }>;
  objections?: Array<{ text: string; answer?: string }>;
  proofs?: Array<{ type: string; title: string; body?: string; url?: string }>;
  tone?: Record<string, unknown>;
  review_snippets?: Array<{ text: string; author?: string; rating?: number }>;
};

function mergeObjects(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v == null) continue;
    if (typeof v === "string") {
      if (!String(out[k] ?? "").trim() && v.trim()) out[k] = v.trim();
    } else if (Array.isArray(v) && Array.isArray(out[k])) {
      out[k] = [...new Set([...(out[k] as string[]), ...v])];
    } else if (!out[k] || (typeof out[k] === "string" && !String(out[k]).trim())) {
      out[k] = v;
    }
  }
  return out;
}

function dedupeByKey<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = key(item).trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

export function mergeForgeKb(
  existing: Record<string, unknown>,
  structured: ForgeKbStructureResult,
): Record<string, unknown> {
  const merged = { ...existing };

  merged.product = mergeObjects(
    (existing.product as Record<string, unknown>) ?? {},
    (structured.product ?? {}) as Record<string, unknown>,
  );
  merged.audience = mergeObjects(
    (existing.audience as Record<string, unknown>) ?? {},
    (structured.audience ?? {}) as Record<string, unknown>,
  );
  merged.usp = mergeObjects(
    (existing.usp as Record<string, unknown>) ?? {},
    (structured.usp ?? {}) as Record<string, unknown>,
  );
  merged.tone = mergeObjects(
    (existing.tone as Record<string, unknown>) ?? {},
    (structured.tone ?? {}) as Record<string, unknown>,
  );

  const append = <T>(field: string, items: T[] | undefined, key: (item: T) => string) => {
    if (!items?.length) return;
    const prev = ((merged[field] as T[]) ?? []).slice();
    merged[field] = dedupeByKey([...prev, ...items], key);
  };

  append("pains", structured.pains, (p) => p.text);
  if (structured.voc?.length) {
    merged.voc = dedupeByKey(
      [...((merged.voc as string[]) ?? []), ...structured.voc],
      (t) => t,
    );
  }
  append("fab_matrix", structured.fab_matrix, (r) => `${r.feature}|${r.benefit}`);
  append("objections", structured.objections, (o) => o.text);
  append("proofs", structured.proofs, (p) => `${p.type}|${p.title}`);

  return merged;
}

export function calcKbCompletion(kb: Record<string, unknown>): number {
  const product = (kb.product as Record<string, unknown>) ?? {};
  const audience = (kb.audience as Record<string, unknown>) ?? {};
  const usp = (kb.usp as Record<string, unknown>) ?? {};
  const sections = [
    Object.values(product).some((v) => String(v ?? "").trim()),
    Object.values(audience).some((v) =>
      Array.isArray(v) ? v.length > 0 : String(v ?? "").trim(),
    ),
    Boolean(String(usp.one_liner ?? "").trim()),
    ((kb.pains as unknown[]) ?? []).length > 0,
    ((kb.fab_matrix as unknown[]) ?? []).length > 0,
    ((kb.objections as unknown[]) ?? []).length > 0,
    ((kb.proofs as unknown[]) ?? []).length > 0,
    ((kb.voc as unknown[]) ?? []).length > 0,
  ];
  const score = sections.filter(Boolean).length;
  return Math.round((score / sections.length) * 100);
}
