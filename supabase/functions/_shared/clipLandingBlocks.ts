/**
 * Конструктор блоков clip-4 — промпт и пост-фильтр для edge.
 */

export const CLIP_STEP_KEYS = ["hook", "why", "proof", "apply"] as const;
export type ClipStepKey = (typeof CLIP_STEP_KEYS)[number];

export const CLIP_STEP_LABELS: Record<ClipStepKey, string> = {
  hook: "Шаг 1 · Боль (hook)",
  why: "Шаг 2 · Причина (why)",
  proof: "Шаг 3 · Доказательства (proof)",
  apply: "Шаг 4 · Заявка (apply)",
};

const CLIP_STEP_BLOCK_KEYS: Record<ClipStepKey, readonly string[]> = {
  hook: ["pain", "pain_escalation", "old_loop"],
  why: ["mechanism", "paradigm_shift", "benefits"],
  proof: ["story", "social_proof", "metrics", "who_for"],
  apply: ["guarantee", "micro_trust", "objections"],
};

export type ClipStepContentBlockKey =
  | "pain"
  | "pain_escalation"
  | "old_loop"
  | "mechanism"
  | "paradigm_shift"
  | "benefits"
  | "story"
  | "social_proof"
  | "metrics"
  | "who_for"
  | "guarantee"
  | "micro_trust"
  | "objections";

export type ClipStepBlocksConfig = Record<ClipStepKey, ClipStepContentBlockKey[]>;

const ALL_BLOCK_KEYS = new Set<string>(
  Object.values(CLIP_STEP_BLOCK_KEYS).flat(),
);

export const CLIP_STEP_DEFAULT_BLOCKS: ClipStepBlocksConfig = {
  hook: ["pain", "pain_escalation"],
  why: ["paradigm_shift", "mechanism", "benefits"],
  proof: ["story", "social_proof"],
  apply: ["guarantee", "micro_trust"],
};

export function normalizeClipStepBlocks(
  input?: Partial<Record<string, string[]>> | null,
): ClipStepBlocksConfig {
  if (!input || typeof input !== "object") {
    return { ...CLIP_STEP_DEFAULT_BLOCKS };
  }

  const out = {} as ClipStepBlocksConfig;
  for (const step of CLIP_STEP_KEYS) {
    const allowed = new Set(CLIP_STEP_BLOCK_KEYS[step]);
    const raw = input[step];
    if (!Array.isArray(raw) || !raw.length) {
      out[step] = [...CLIP_STEP_DEFAULT_BLOCKS[step]];
      continue;
    }
    const seen = new Set<string>();
    const picked: ClipStepContentBlockKey[] = [];
    for (const key of raw) {
      if (!allowed.has(key) || seen.has(key) || !ALL_BLOCK_KEYS.has(key)) continue;
      seen.add(key);
      picked.push(key as ClipStepContentBlockKey);
    }
    out[step] = picked.length ? picked : [...CLIP_STEP_DEFAULT_BLOCKS[step]];
  }
  return out;
}

function allowedStepFields(
  stepKey: ClipStepKey,
  selected: ClipStepContentBlockKey[],
): Set<string> {
  const fields = new Set<string>(["key", "label", "hero"]);
  if (stepKey === "apply") {
    fields.add("lead_form_personal");
  } else {
    fields.add("cta");
  }
  for (const block of selected) fields.add(block);
  return fields;
}

const BLOCK_PROMPT_HINTS: Partial<Record<ClipStepContentBlockKey, string>> = {
  pain_escalation:
    "pain_escalation: headline + body — последствия бездействия, эмоциональная эскалация перед CTA. Не дублируй pain.points.",
  old_loop:
    "old_loop: title + items (3–4) — что уже пробовали и почему не помогло. Петля «круг по кругу».",
  benefits:
    "benefits: title + items (3–4) — конкретные выгоды после механизма, бытовым языком.",
  story:
    "story: headline + body + author + result — одна главная история клиента из KB.",
  who_for:
    "who_for: title + for_items (3+) + not_for_items (1–2) — кому подойдёт и кому рано.",
  objections:
    "objections: items [{question, answer}] — 2–3 последних страха перед формой.",
};

export function buildClipStepBlocksPromptSection(config: ClipStepBlocksConfig): string {
  const lines: string[] = [
    "## КОНСТРУКТОР БЛОКОВ CLIP-4 (выбор пользователя — приоритет)",
    "Пользователь собрал каждый из 4 экранов из своих блоков. НЕ добавляй секции вне списка для шага.",
    "hero на каждом шаге обязателен. hook/why/proof — cta с next_step. apply — lead_form_personal, без cta.next_step.",
    "",
  ];

  for (const step of CLIP_STEP_KEYS) {
    const selected = config[step];
    const sequence =
      step === "apply"
        ? ["hero", ...selected, "lead_form_personal"]
        : ["hero", ...selected, "cta"];
    lines.push(
      `### ${CLIP_STEP_LABELS[step]}`,
      `Только блоки: ${sequence.join(" → ")}.`,
    );
    for (const block of selected) {
      const hint = BLOCK_PROMPT_HINTS[block];
      if (hint) lines.push(hint);
    }
    if (step === "why" && selected.includes("paradigm_shift") && !selected.includes("mechanism")) {
      lines.push("Акцент на paradigm_shift (миф → правда → bridge). mechanism не нужен.");
    }
    if (step === "why" && selected.includes("mechanism") && !selected.includes("paradigm_shift")) {
      lines.push("Акцент на mechanism.title + mechanism.body. paradigm_shift не нужен.");
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function applyClipStepBlockFilter(
  content: Record<string, unknown>,
  config: ClipStepBlocksConfig,
): Record<string, unknown> {
  const stepsRaw = content.steps;
  if (!Array.isArray(stepsRaw)) return content;

  const steps = stepsRaw.map((raw) => {
    const step = { ...(raw as Record<string, unknown>) };
    const stepKey = String(step.key ?? "") as ClipStepKey;
    if (!CLIP_STEP_KEYS.includes(stepKey)) return step;

    const allowed = allowedStepFields(stepKey, config[stepKey]);
    for (const key of Object.keys(step)) {
      if (!allowed.has(key)) delete step[key];
    }
    return step;
  });

  return { ...content, steps };
}

/** Компактные фрагменты без minItems/maxItems — иначе Gemini 400 «too many states». */
const CLIP_BLOCK_SCHEMA_FRAGMENTS: Record<ClipStepContentBlockKey, Record<string, unknown>> = {
  pain: {
    type: "object",
    properties: {
      title: { type: "string" },
      points: { type: "array", items: { type: "string" } },
    },
  },
  pain_escalation: {
    type: "object",
    properties: {
      headline: { type: "string" },
      body: { type: "string" },
    },
  },
  old_loop: {
    type: "object",
    properties: {
      title: { type: "string" },
      items: { type: "array", items: { type: "string" } },
    },
  },
  mechanism: {
    type: "object",
    properties: {
      title: { type: "string" },
      body: { type: "string" },
    },
  },
  paradigm_shift: {
    type: "object",
    properties: {
      headline: { type: "string" },
      old_belief: { type: "string" },
      new_belief: { type: "string" },
      bridge: { type: "string" },
    },
  },
  benefits: {
    type: "object",
    properties: {
      title: { type: "string" },
      items: { type: "array", items: { type: "string" } },
    },
  },
  story: {
    type: "object",
    properties: {
      headline: { type: "string" },
      body: { type: "string" },
      author: { type: "string" },
      result: { type: "string" },
    },
  },
  social_proof: {
    type: "object",
    properties: {
      title: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            quote: { type: "string" },
            author: { type: "string" },
            role: { type: "string" },
          },
        },
      },
    },
  },
  metrics: {
    type: "object",
    properties: {
      title: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            number: { type: "string" },
            label: { type: "string" },
          },
        },
      },
    },
  },
  who_for: {
    type: "object",
    properties: {
      title: { type: "string" },
      for_items: { type: "array", items: { type: "string" } },
      not_for_items: { type: "array", items: { type: "string" } },
    },
  },
  guarantee: {
    type: "object",
    properties: {
      headline: { type: "string" },
      body: { type: "string" },
    },
  },
  micro_trust: {
    type: "object",
    properties: {
      items: { type: "array", items: { type: "string" } },
    },
  },
  objections: {
    type: "object",
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
        },
      },
    },
  },
};

const CLIP_HERO_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    subheadline: { type: "string" },
    badge: { type: "string" },
  },
};

const CLIP_CTA_SCHEMA = {
  type: "object",
  properties: {
    label: { type: "string" },
    next_step: { type: "string" },
  },
};

const CLIP_LEAD_FORM_SCHEMA = {
  type: "object",
  properties: {
    headline: { type: "string" },
    subheadline: { type: "string" },
    persona_name: { type: "string" },
    persona_role: { type: "string" },
    persona_status: { type: "string" },
    cta: { type: "string" },
    consent_text: { type: "string" },
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          placeholder: { type: "string" },
        },
      },
    },
  },
};

/** Динамическая схема — только блоки из конструктора (лимит Gemini structured output). */
export function buildClipSchemaForBlocks(config: ClipStepBlocksConfig): Record<string, unknown> {
  const usedBlocks = new Set<ClipStepContentBlockKey>();
  for (const step of CLIP_STEP_KEYS) {
    for (const block of config[step]) usedBlocks.add(block);
  }

  const stepProperties: Record<string, unknown> = {
    key: { type: "string" },
    label: { type: "string" },
    hero: CLIP_HERO_SCHEMA,
    cta: CLIP_CTA_SCHEMA,
    lead_form_personal: CLIP_LEAD_FORM_SCHEMA,
  };

  for (const block of usedBlocks) {
    stepProperties[block] = CLIP_BLOCK_SCHEMA_FRAGMENTS[block];
  }

  return {
    type: "object",
    required: ["meta", "steps"],
    properties: {
      meta: {
        type: "object",
        required: ["project_name", "target_action", "tone_of_voice"],
        properties: {
          project_name: { type: "string" },
          target_action: { type: "string" },
          tone_of_voice: { type: "string" },
          support_phone: { type: "string" },
          live_readers_hint: { type: "number" },
        },
      },
      steps: {
        type: "array",
        description: "Ровно 4 шага: hook → why → proof → apply",
        items: {
          type: "object",
          required: ["key", "label", "hero"],
          properties: stepProperties,
        },
      },
    },
  };
}
