export const CLIP_STEP_KEYS = ["hook", "why", "proof", "apply"] as const;
export type ClipStepKey = (typeof CLIP_STEP_KEYS)[number];

export const CLIP_STEP_LABELS: Record<ClipStepKey, string> = {
  hook: "Шаг 1 · Боль (hook)",
  why: "Шаг 2 · Причина (why)",
  proof: "Шаг 3 · Доказательства (proof)",
  apply: "Шаг 4 · Заявка (apply)",
};

export type ClipStepPromptConfig = {
  instruction?: string;
  /** Подставляется дословно в hero.headline после генерации. */
  headline_fixed?: string;
  /** hook/why/proof → cta.label; apply → lead_form_personal.cta */
  cta_label_fixed?: string;
};

export type ForgeGenerationPromptConfig = {
  full?: {
    system_append?: string;
    user_task_append?: string;
  };
  clip?: {
    system_append?: string;
    user_task_append?: string;
    steps?: Partial<Record<ClipStepKey, ClipStepPromptConfig>>;
  };
};

export function emptyPromptConfig(): ForgeGenerationPromptConfig {
  return {};
}

/** Краткие выдержки из дефолтных промптов — для подсказки в UI. */
export const PROMPT_DEFAULT_HINTS = {
  fullSystem:
    "Ты — старший продакт-маркетолог и копирайтер… ШАГ 0 — мышление перед генерацией (осознанность, VOC, механизм, эмоциональная дуга). Сценарий лендинга приоритетнее универсальной структуры. Полный текст — в prototypeGenerationCore.ts.",
  fullUserTask:
    "18 блоков (hero → final_cta), 3 варианта заголовка, минимум 5 возражений и 3 кейса с цифрами. Без markdown в текстовых полях. sequence[0] = hero, последний = final_cta.",
  clipSystem:
    "Арт-директор перформанс-маркетинга, 4 полноэкранных шага hook → why → proof → apply. Тёмная карточка боли, жёлтый CTA. Структура из референсов clip-4 или generic-эталон.",
  clipUserTask:
    "Собери клип-лендинг из 4 экранов для холодного трафика. Заголовки из VOC, без штампов. Ровно 4 шага hook → why → proof → apply.",
  clipSteps: {
    hook: "hero.headline — вопрос на боль; pain.points — 4 бытовых сцены; cta → why",
    why: "контринтуитивный поворот; mechanism/paradigm_shift; cta → proof",
    proof: "social_proof 2–3 цитаты; metrics только из KB; cta → apply",
    apply: "lead_form_personal + guarantee + micro_trust; без next_step",
  },
} as const;
