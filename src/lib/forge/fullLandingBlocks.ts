/**
 * Каталог блоков full-лендинга для конструктора в Лаборатории.
 */

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

export type FullLandingBlockMeta = {
  key: FullLandingMiddleBlockKey;
  label: string;
  hint: string;
  /** Когда блок часто лишний — подсказка в UI */
  skipHint?: string;
};

export const FULL_LANDING_BLOCK_CATALOG: FullLandingBlockMeta[] = [
  {
    key: "pain",
    label: "Боль",
    hint: "Узнавание проблемы, симптомы из жизни ЦА",
  },
  {
    key: "paradigm_shift",
    label: "Миф и правда",
    hint: "Распространённая ошибка → как на самом деле → почему миф не работает",
    skipHint: "Если миф уже раскрыт в pain или why clip — можно объединить",
  },
  {
    key: "enemy_section",
    label: "Враг",
    hint: "Кто/что виновато — снимает вину с клиента",
    skipHint: "Часто лишний для тёплого трафика и коротких лендов",
  },
  {
    key: "solution",
    label: "Решение",
    hint: "Новый подход и что делать",
  },
  {
    key: "transformation",
    label: "До / после",
    hint: "Сцены жизни до и после",
    skipHint: "Можно опустить, если transformation уже в hero или social_proof",
  },
  {
    key: "value",
    label: "Ценность в цифрах",
    hint: "Метрики, выгоды, fascinations",
    skipHint: "Не нужен для MVP-проверки гипотезы",
  },
  {
    key: "product",
    label: "Продукт",
    hint: "Формат, комплект, цена из KB",
  },
  {
    key: "process",
    label: "Как это работает",
    hint: "3 простых шага — снижает страх сложности",
    skipHint: "Лишний, если путь очевиден из product",
  },
  {
    key: "founder",
    label: "Эксперт / основатель",
    hint: "Доверие через личность и опыт",
    skipHint: "Не обязателен для commodity-продуктов",
  },
  {
    key: "comparison",
    label: "Сравнение",
    hint: "Мы vs альтернативы",
    skipHint: "Часто лишний на холодном трафике",
  },
  {
    key: "social_proof",
    label: "Соц. доказательства",
    hint: "Отзывы и кейсы из KB",
  },
  {
    key: "not_for",
    label: "Кому не подходит",
    hint: "Отсечение — усиливает доверие «своих»",
    skipHint: "Можно убрать в коротком ленде",
  },
  {
    key: "objections",
    label: "Возражения",
    hint: "Эмоциональные страхи и сомнения",
  },
  {
    key: "faq",
    label: "FAQ",
    hint: "Практика: доставка, состав, оплата",
    skipHint: "Не нужен для цифровых услуг без сложной логистики",
  },
  {
    key: "future_pacing",
    label: "Будущее",
    hint: "Визуализация жизни после покупки",
    skipHint: "Часто лишний в коротком ленде",
  },
  {
    key: "guarantee",
    label: "Гарантия",
    hint: "Снятие риска перед CTA",
  },
];

export type FullLandingBlockPresetId =
  | "standard"
  | "short"
  | "story"
  | "agora"
  | "minimal";

export const FULL_LANDING_BLOCK_PRESETS: {
  id: FullLandingBlockPresetId;
  label: string;
  description: string;
  blocks: FullLandingMiddleBlockKey[];
}[] = [
  {
    id: "standard",
    label: "Стандарт",
    description: "Баланс убеждения и длины — большинство блоков",
    blocks: [
      "pain",
      "paradigm_shift",
      "enemy_section",
      "solution",
      "transformation",
      "value",
      "product",
      "process",
      "founder",
      "social_proof",
      "objections",
      "future_pacing",
      "guarantee",
    ],
  },
  {
    id: "short",
    label: "Короткий",
    description: "8–10 секций — проверка гипотезы, холодный трафик",
    blocks: [
      "pain",
      "paradigm_shift",
      "solution",
      "product",
      "social_proof",
      "objections",
      "guarantee",
    ],
  },
  {
    id: "story",
    label: "История",
    description: "Эксперт рано, эмоции, без тяжёлых таблиц",
    blocks: [
      "pain",
      "founder",
      "paradigm_shift",
      "solution",
      "process",
      "product",
      "social_proof",
      "future_pacing",
      "guarantee",
    ],
  },
  {
    id: "agora",
    label: "Agora",
    description: "Враг + смена картины мира + future pacing",
    blocks: [
      "pain",
      "enemy_section",
      "paradigm_shift",
      "solution",
      "transformation",
      "social_proof",
      "future_pacing",
      "guarantee",
    ],
  },
  {
    id: "minimal",
    label: "Минимум",
    description: "Только суть: боль → решение → доказательства",
    blocks: ["pain", "solution", "social_proof", "guarantee"],
  },
];

const SCENARIO_PRESET: Record<string, FullLandingBlockPresetId> = {
  hypothesis_test: "short",
  cold_traffic: "standard",
  product_card: "short",
  consultation_lead: "story",
  product_sale: "standard",
  webinar: "story",
};

const FORMAT_PRESET: Record<string, FullLandingBlockPresetId> = {
  kitchen: "story",
  agora: "agora",
  longread: "standard",
  classic: "standard",
};

export function presetBlocksForScenario(
  scenarioId?: string | null,
  format?: string | null,
): FullLandingMiddleBlockKey[] {
  const presetId =
    (scenarioId && SCENARIO_PRESET[scenarioId]) ||
    (format && FORMAT_PRESET[format]) ||
    "standard";
  const preset = FULL_LANDING_BLOCK_PRESETS.find((p) => p.id === presetId);
  return preset?.blocks ?? FULL_LANDING_BLOCK_PRESETS[0].blocks;
}

export function buildFullBlockSequence(middle: FullLandingMiddleBlockKey[]): string[] {
  const clean = middle.filter((k) => k !== "hero" && k !== "final_cta");
  return ["hero", ...clean, "final_cta"];
}

export type BlockSkipSuggestion = {
  key: FullLandingMiddleBlockKey;
  reason: string;
};

/** Блоки, которые можно убрать при текущем сценарии/формате */
export function suggestSkippedBlocks(
  selected: FullLandingMiddleBlockKey[],
  scenarioId?: string | null,
  format?: string | null,
): BlockSkipSuggestion[] {
  const selectedSet = new Set(selected);
  const suggestions: BlockSkipSuggestion[] = [];

  const add = (key: FullLandingMiddleBlockKey, reason: string) => {
    if (selectedSet.has(key)) suggestions.push({ key, reason });
  };

  if (scenarioId === "hypothesis_test") {
    add("comparison", "Для проверки гипотезы сравнение с конкурентами редко нужно");
    add("founder", "MVP-ленд короче без блока эксперта");
    add("enemy_section", "На быстром тесте враг часто лишний");
    add("transformation", "Достаточно pain + social_proof");
    add("value", "Цифры можно в hero или product");
    add("faq", "FAQ отложите на вторую итерацию");
    add("not_for", "Отсечение не критично для первого теста");
    add("process", "Если продукт простой — шаги очевидны");
    add("future_pacing", "Короткий ленд закрывается без future pacing");
  }

  if (scenarioId === "product_card") {
    add("enemy_section", "Визитка продукта — без «врага»");
    add("comparison", "Не обязательно для карточки");
    add("paradigm_shift", "Можно сразу к product");
  }

  if (format === "kitchen" || format === "story") {
    add("comparison", "В story-формате таблица сравнения режет поток");
    add("value", "Цифры лучше вплести в narrative");
  }

  return suggestions;
}

export function blockLabel(key: string): string {
  return FULL_LANDING_BLOCK_CATALOG.find((b) => b.key === key)?.label ?? key;
}
