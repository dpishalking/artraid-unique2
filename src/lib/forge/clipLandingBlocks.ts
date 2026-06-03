/**
 * Конструктор блоков clip-4 — каталог per-step для Лаборатории.
 */
import type { ClipStepKey } from "@/lib/forge/generationPrompts";
import { CLIP_STEP_KEYS, CLIP_STEP_LABELS } from "@/lib/forge/generationPrompts";

export { CLIP_STEP_KEYS, CLIP_STEP_LABELS };
export type { ClipStepKey };

/** Опциональные контент-блоки внутри шага (hero / cta / lead_form всегда включены). */
export const CLIP_STEP_BLOCK_KEYS = {
  hook: ["pain", "pain_escalation", "old_loop"],
  why: ["mechanism", "paradigm_shift", "benefits"],
  proof: ["story", "social_proof", "metrics", "who_for"],
  apply: ["guarantee", "micro_trust", "objections"],
} as const satisfies Record<ClipStepKey, readonly string[]>;

export type ClipStepContentBlockKey =
  | (typeof CLIP_STEP_BLOCK_KEYS.hook)[number]
  | (typeof CLIP_STEP_BLOCK_KEYS.why)[number]
  | (typeof CLIP_STEP_BLOCK_KEYS.proof)[number]
  | (typeof CLIP_STEP_BLOCK_KEYS.apply)[number];

export type ClipStepBlocksConfig = Record<ClipStepKey, ClipStepContentBlockKey[]>;

export type ClipStepBlockMeta = {
  key: ClipStepContentBlockKey;
  label: string;
  hint: string;
  skipHint?: string;
};

export const CLIP_BLOCK_CATALOG: ClipStepBlockMeta[] = [
  {
    key: "pain",
    label: "Боль",
    hint: "Тёмная карточка: 4 узнаваемые сцены из жизни ЦА",
  },
  {
    key: "pain_escalation",
    label: "Усиление боли",
    hint: "Последствия бездействия, эскалация ставок — мост к CTA",
    skipHint: "Можно убрать, если hero уже достаточно тревожный",
  },
  {
    key: "old_loop",
    label: "Петля старых способов",
    hint: "Что уже пробовали и почему не сработало — узнавание «круг по кругу»",
    skipHint: "Лишний, если pain.points уже перечисляют неудачные попытки",
  },
  {
    key: "mechanism",
    label: "Механизм",
    hint: "Как продукт решает проблему — причина и эффекты",
    skipHint: "Если достаточно блока «Миф и правда» — можно убрать",
  },
  {
    key: "paradigm_shift",
    label: "Миф и правда",
    hint: "Распространённая ошибка → как на самом деле → почему миф не работает",
    skipHint: "Если механизм уже раскрывает причину — можно убрать",
  },
  {
    key: "benefits",
    label: "Преимущества",
    hint: "3–4 коротких выгоды после механизма — «что изменится»",
    skipHint: "Можно вплести в mechanism.body",
  },
  {
    key: "story",
    label: "История клиента",
    hint: "Главный кейс: ситуация → решение → результат из KB",
  },
  {
    key: "social_proof",
    label: "Соц. доказательства",
    hint: "2–3 цитаты с автором и результатом из KB",
  },
  {
    key: "metrics",
    label: "Цифры",
    hint: "Метрики и факты — только если есть в KB",
    skipHint: "Часто лишний, если цифры уже в отзывах",
  },
  {
    key: "who_for",
    label: "Для кого",
    hint: "Кому подойдёт / кому рано — отсечение усиливает доверие",
    skipHint: "Не обязателен на холодном трафике",
  },
  {
    key: "guarantee",
    label: "Гарантия",
    hint: "Снятие риска перед формой",
  },
  {
    key: "micro_trust",
    label: "Микро-доверие",
    hint: "Короткие пункты: доставка, оплата, поддержка",
    skipHint: "Можно убрать, если guarantee уже закрывает страхи",
  },
  {
    key: "objections",
    label: "Возражения",
    hint: "2–3 коротких Q&A перед формой — снимает последние страхи",
    skipHint: "Лишний, если guarantee + micro_trust уже закрывают риски",
  },
];

export const CLIP_STEP_DEFAULT_BLOCKS: ClipStepBlocksConfig = {
  hook: ["pain", "pain_escalation"],
  why: ["paradigm_shift", "mechanism", "benefits"],
  proof: ["story", "social_proof"],
  apply: ["guarantee", "micro_trust"],
};

export type ClipBlockPresetId = "standard" | "short" | "myth" | "proof_heavy";

export const CLIP_BLOCK_PRESETS: {
  id: ClipBlockPresetId;
  label: string;
  description: string;
  blocks: ClipStepBlocksConfig;
}[] = [
  {
    id: "standard",
    label: "Стандарт",
    description: "Боль → миф + механизм → отзывы → гарантия",
    blocks: CLIP_STEP_DEFAULT_BLOCKS,
  },
  {
    id: "short",
    label: "Короткий",
    description: "Меньше блоков на экран — быстрый тест гипотезы",
    blocks: {
      hook: ["pain", "pain_escalation"],
      why: ["paradigm_shift"],
      proof: ["social_proof"],
      apply: ["guarantee"],
    },
  },
  {
    id: "myth",
    label: "Через миф",
    description: "Акцент на развенчание, без тяжёлого mechanism",
    blocks: {
      hook: ["pain", "old_loop"],
      why: ["paradigm_shift"],
      proof: ["story", "social_proof"],
      apply: ["guarantee", "micro_trust"],
    },
  },
  {
    id: "proof_heavy",
    label: "Доказательства",
    description: "История + цифры + полное доверие на apply",
    blocks: {
      hook: ["pain", "pain_escalation", "old_loop"],
      why: ["mechanism", "benefits"],
      proof: ["story", "social_proof", "metrics", "who_for"],
      apply: ["guarantee", "micro_trust", "objections"],
    },
  },
];

const SCENARIO_PRESET: Partial<Record<string, ClipBlockPresetId>> = {
  hypothesis_test: "short",
  cold_traffic: "standard",
  product_card: "short",
  consultation_lead: "myth",
  product_sale: "standard",
};

export function presetClipBlocksForScenario(scenarioId?: string | null): ClipStepBlocksConfig {
  const presetId = (scenarioId && SCENARIO_PRESET[scenarioId]) || "standard";
  const preset = CLIP_BLOCK_PRESETS.find((p) => p.id === presetId);
  return preset?.blocks ?? CLIP_STEP_DEFAULT_BLOCKS;
}

export function blocksForStep(step: ClipStepKey): ClipStepBlockMeta[] {
  const keys = CLIP_STEP_BLOCK_KEYS[step];
  return keys
    .map((k) => CLIP_BLOCK_CATALOG.find((b) => b.key === k))
    .filter((b): b is ClipStepBlockMeta => Boolean(b));
}

export function buildClipStepSequence(
  step: ClipStepKey,
  selected: ClipStepContentBlockKey[],
): string[] {
  const order = CLIP_STEP_BLOCK_KEYS[step];
  const middle = order.filter((k) => selected.includes(k as ClipStepContentBlockKey));
  if (step === "apply") {
    return ["hero", ...middle, "lead_form_personal"];
  }
  return ["hero", ...middle, "cta"];
}

export function clipBlockLabel(key: string): string {
  return CLIP_BLOCK_CATALOG.find((b) => b.key === key)?.label ?? key;
}

const SEQUENCE_LABELS: Record<string, string> = {
  hero: "Hero",
  cta: "CTA",
  lead_form_personal: "Форма",
};

export function clipSequenceLabel(key: string): string {
  return SEQUENCE_LABELS[key] ?? clipBlockLabel(key);
}

export function validateClipStepBlocks(config: ClipStepBlocksConfig): string | null {
  if (!config.hook.includes("pain")) {
    return "На экране «Боль» нужна карточка боли";
  }
  if (!config.why.some((k) => k === "mechanism" || k === "paradigm_shift")) {
    return "На экране «Причина» выберите механизм или «Миф и правда»";
  }
  if (!config.proof.some((k) => k === "social_proof" || k === "story")) {
    return "На экране «Доказательства» нужны отзывы или история клиента";
  }
  if (!config.apply.some((k) => k === "guarantee" || k === "micro_trust")) {
    return "На экране «Заявка» выберите гарантию или микро-доверие";
  }
  return null;
}

export type ClipStepSkipSuggestion = {
  step: ClipStepKey;
  key: ClipStepContentBlockKey;
  reason: string;
};

export function suggestSkippedClipBlocks(
  config: ClipStepBlocksConfig,
  scenarioId?: string | null,
): ClipStepSkipSuggestion[] {
  const out: ClipStepSkipSuggestion[] = [];
  const add = (step: ClipStepKey, key: ClipStepContentBlockKey, reason: string) => {
    if (config[step].includes(key)) out.push({ step, key, reason });
  };

  if (scenarioId === "hypothesis_test") {
    add("hook", "pain_escalation", "На быстром тесте достаточно pain без эскалации");
    add("hook", "old_loop", "Петлю можно вплести в pain.points");
    add("why", "benefits", "Выгоды можно сократить в mechanism");
    add("why", "mechanism", "Для быстрого теста достаточно «Миф и правда»");
    add("proof", "metrics", "Цифры можно отложить на вторую итерацию");
    add("proof", "who_for", "Отсечение не критично для первого теста");
    add("apply", "micro_trust", "На MVP хватит одной гарантии");
    add("apply", "objections", "FAQ можно добавить после первых лидов");
  }

  if (config.why.includes("mechanism") && config.why.includes("paradigm_shift")) {
    add("why", "mechanism", "Оба блока на одном экране — длинно; часто хватает одного");
  }

  return out;
}
