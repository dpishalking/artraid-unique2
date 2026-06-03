/**
 * Конструктор блоков full-лендинга — общая логика для промпта и JSON-схемы Gemini.
 */
import { PROTOTYPE_SCHEMA } from "./prototypeGenerationCore.ts";

/** Средние блоки (между hero и final_cta). micro_copy — отдельно, не в sequence. */
export const FULL_LANDING_MIDDLE_BLOCK_KEYS = [
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
] as const;

export type FullLandingMiddleBlockKey = (typeof FULL_LANDING_MIDDLE_BLOCK_KEYS)[number];

const MIDDLE_SET = new Set<string>(FULL_LANDING_MIDDLE_BLOCK_KEYS);

export function normalizeIncludedMiddleBlocks(input?: string[] | null): FullLandingMiddleBlockKey[] {
  if (!input?.length) return [...FULL_LANDING_MIDDLE_BLOCK_KEYS];
  const seen = new Set<string>();
  const out: FullLandingMiddleBlockKey[] = [];
  for (const key of input) {
    if (!MIDDLE_SET.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key as FullLandingMiddleBlockKey);
  }
  return out.length ? out : [...FULL_LANDING_MIDDLE_BLOCK_KEYS];
}

export function buildFullBlockSequence(middleBlocks: FullLandingMiddleBlockKey[]): string[] {
  const middle = middleBlocks.filter((k) => k !== "hero" && k !== "final_cta");
  return ["hero", ...middle, "final_cta"];
}

export function buildPrototypeSchemaForBlocks(middleBlocks: FullLandingMiddleBlockKey[]) {
  const middle = normalizeIncludedMiddleBlocks(middleBlocks);
  const sequenceKeys = buildFullBlockSequence(middle);
  const requiredBlockKeys = [...sequenceKeys, "micro_copy"];

  const allBlockProps = PROTOTYPE_SCHEMA.properties.blocks.properties as Record<string, unknown>;
  const filteredProperties: Record<string, unknown> = {};
  for (const key of requiredBlockKeys) {
    if (allBlockProps[key]) filteredProperties[key] = allBlockProps[key];
  }

  const metaProps = PROTOTYPE_SCHEMA.properties.meta.properties as Record<string, unknown>;
  const sequenceField = metaProps.sequence as Record<string, unknown>;

  return {
    ...PROTOTYPE_SCHEMA,
    properties: {
      ...PROTOTYPE_SCHEMA.properties,
      meta: {
        ...PROTOTYPE_SCHEMA.properties.meta,
        properties: {
          ...metaProps,
          sequence: {
            ...sequenceField,
            description:
              `Упорядоченный список блоков лендинга. СТРОГО только эти ключи в логичном порядке убеждения: ${sequenceKeys.join(" → ")}. Первый — hero, последний — final_cta.`,
          },
        },
      },
      blocks: {
        type: "object",
        required: requiredBlockKeys,
        properties: filteredProperties,
      },
    },
  };
}

export function buildBlockConstructorPromptSection(middleBlocks: FullLandingMiddleBlockKey[]): string {
  const sequence = buildFullBlockSequence(middleBlocks);
  return [
    "## КОНСТРУКТОР БЛОКОВ (выбор пользователя — приоритет)",
    `Пользователь собрал лендинг только из этих секций: ${sequence.join(" → ")} + micro_copy.`,
    "НЕ добавляй другие блоки в meta.sequence и не раздувай лендинг блоками вне списка.",
    "Каждый выбранный блок раскрой по теме и KB — это кастомная структура, не универсальный шаблон на 18 блоков.",
    `meta.sequence = [${sequence.map((k) => `"${k}"`).join(", ")}] — именно в этом или более логичном порядке убеждения (hero первый, final_cta последний).`,
    "В sequence_rationale объясни, почему выбран именно такой набор блоков для этой темы.",
  ].join("\n");
}
