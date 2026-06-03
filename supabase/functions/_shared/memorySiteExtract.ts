/** Схема и маппинг полей памяти, извлекаемых с сайта. */

export const MEMORY_SITE_EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    company: {
      type: "object",
      properties: {
        company_name: { type: "string" },
        company_description: { type: "string" },
        company_industry: { type: "string" },
        company_mission: { type: "string" },
        company_location: { type: "string" },
        company_advantages: { type: "array", items: { type: "string" } },
      },
    },
    founder: {
      type: "object",
      properties: {
        founder_name: { type: "string" },
        founder_role: { type: "string" },
        founder_bio: { type: "string" },
        founder_expertise: { type: "string" },
      },
    },
    product: {
      type: "object",
      properties: {
        product_name: { type: "string" },
        product_description: { type: "string" },
        product_category: { type: "string" },
        product_format: { type: "string" },
        product_core_result: { type: "string" },
        product_unique_mechanism: { type: "string" },
        product_features: { type: "array", items: { type: "string" } },
        product_benefits: { type: "array", items: { type: "string" } },
      },
    },
    audience: {
      type: "object",
      properties: {
        target_audience: { type: "string" },
        audience_segments: { type: "array", items: { type: "string" } },
        best_customers: { type: "string" },
        customer_situation: { type: "string" },
      },
    },
    pains_desires: {
      type: "object",
      properties: {
        main_pain: { type: "string" },
        main_desire: { type: "string" },
        secondary_pains: { type: "array", items: { type: "string" } },
        desired_outcomes: { type: "array", items: { type: "string" } },
        fears: { type: "string" },
      },
    },
    offer_positioning: {
      type: "object",
      properties: {
        current_offer: { type: "string" },
        key_promise: { type: "string" },
        positioning: { type: "string" },
        unique_selling_proposition: { type: "string" },
        differentiation: { type: "string" },
        guarantee: { type: "string" },
        call_to_action: { type: "string" },
      },
    },
    websites: {
      type: "object",
      properties: {
        main_website_url: { type: "string" },
        current_landing_goal: { type: "string" },
      },
    },
    proofs: {
      type: "object",
      properties: {
        testimonials: { type: "string" },
        cases: { type: "string" },
        numbers: { type: "string" },
        social_proof: { type: "string" },
        client_logos: { type: "array", items: { type: "string" } },
      },
    },
    pricing: {
      type: "object",
      properties: {
        pricing_model: { type: "string" },
        price_points: { type: "string" },
        packages: { type: "string" },
      },
    },
    tone: {
      type: "object",
      properties: {
        tone_of_voice: { type: "string" },
        brand_style: { type: "string" },
        examples_of_good_copy: { type: "string" },
      },
    },
  },
} as const;

const SCALAR_SECTIONS = new Set([
  "company",
  "founder",
  "product",
  "audience",
  "pains_desires",
  "offer_positioning",
  "websites",
  "proofs",
  "pricing",
  "tone",
]);

function isFilledValue(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some((item) => typeof item === "string" && item.trim().length > 0);
  return false;
}

function normalizeSuggested(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed.slice(0, 4000) : null;
  }
  if (Array.isArray(value)) {
    const lines = value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 20);
    return lines.length ? lines : null;
  }
  return null;
}

export function flattenMemoryExtract(raw: unknown): Array<{ section: string; field: string; value: unknown }> {
  if (!raw || typeof raw !== "object") return [];
  const root = raw as Record<string, unknown>;
  const out: Array<{ section: string; field: string; value: unknown }> = [];

  for (const [section, branch] of Object.entries(root)) {
    if (!SCALAR_SECTIONS.has(section) || !branch || typeof branch !== "object" || Array.isArray(branch)) continue;
    for (const [field, value] of Object.entries(branch as Record<string, unknown>)) {
      const normalized = normalizeSuggested(value);
      if (normalized != null) out.push({ section, field, value: normalized });
    }
  }

  return out;
}

export function buildMemoryUpdateRowsFromExtract(
  projectId: string,
  sourceId: string,
  extracted: Array<{ section: string; field: string; value: unknown }>,
  currentMemory: Record<string, unknown>,
  options?: { fillEmptyOnly?: boolean; sourceType?: string },
): Record<string, unknown>[] {
  const fillEmptyOnly = options?.fillEmptyOnly !== false;
  const sourceType = options?.sourceType ?? "site_import";
  const rows: Record<string, unknown>[] = [];

  for (const item of extracted) {
    if (!SCALAR_SECTIONS.has(item.section)) continue;

    const branch = currentMemory[item.section];
    const currentField =
      branch && typeof branch === "object" && !Array.isArray(branch)
        ? (branch as Record<string, unknown>)[item.field]
        : undefined;

    if (fillEmptyOnly && isFilledValue(currentField)) continue;

    rows.push({
      project_id: projectId,
      source_type: sourceType,
      source_id: sourceId,
      section: item.section,
      field: item.field,
      old_value: currentField ?? null,
      suggested_value: item.value,
      status: "pending",
    });
  }

  return rows;
}

export function buildMemoryExtractPromptFromText(
  sourceLabel: string,
  sourceText: string,
  projectCard: Record<string, unknown>,
): string {
  return `Ты — старший маркетолог. По материалам ниже извлеки факты для «памяти проекта» — структурированной базы знаний о бизнесе.

Правила:
- Пиши по-русски, конкретно, без воды и без выдумок.
- Бери только то, что явно следует из текста. Если данных нет — оставь поле пустым (не включай ключ).
- Не дублируй одно и то же в разных полях.
- Массивы — короткие пункты (2–8 элементов), без нумерации.
- Длинные текстовые поля — 1–4 предложения, до 600 символов каждое.

Источник: ${sourceLabel}

## Уже известно о проекте (не противоречь без оснований):
${JSON.stringify(projectCard, null, 2)}

## Материалы:
${sourceText}`;
}

export function buildMemoryExtractPrompt(siteUrl: string, siteText: string, projectCard: Record<string, unknown>): string {
  return buildMemoryExtractPromptFromText(`Сайт ${siteUrl}`, siteText, projectCard);
}
