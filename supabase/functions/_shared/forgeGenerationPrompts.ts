/**
 * Настраиваемые промпты генерации Лаборатории (full + clip-4).
 * Глобальные (forge_lab_settings) + per-product (forge_products.generation_prompts) складываются.
 */
import { clip4SystemInstruction } from "./forgeClipReference.ts";
import { PROTOTYPE_SYSTEM_PROMPT } from "./prototypeGenerationCore.ts";

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
  headline_fixed?: string;
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

export const DEFAULT_CLIP_USER_TASK_LINES = [
  "Собери клип-лендинг из 4 экранов для холодного трафика. Структура и тон — как в референсе clip-4 (тёмная карточка боли, жёлтый CTA).",
  "Используй базу знаний выше. Заголовки — из VOC и отзывов, без штампов и квадратных скобок.",
  "Возврати ровно 4 шага в порядке hook → why → proof → apply.",
  "meta.support_phone — из KB или материалов; meta.live_readers_hint — число 8–18.",
];

export function emptyPromptConfig(): ForgeGenerationPromptConfig {
  return {};
}

function trimOrEmpty(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export function mergePromptConfigs(
  ...configs: (ForgeGenerationPromptConfig | null | undefined)[]
): ForgeGenerationPromptConfig {
  const out: ForgeGenerationPromptConfig = {};
  for (const cfg of configs) {
    if (!cfg) continue;
    if (cfg.full) {
      out.full = out.full ?? {};
      const a = trimOrEmpty(cfg.full.system_append);
      const b = trimOrEmpty(cfg.full.user_task_append);
      if (a) out.full.system_append = [out.full.system_append, a].filter(Boolean).join("\n\n");
      if (b) out.full.user_task_append = [out.full.user_task_append, b].filter(Boolean).join("\n\n");
    }
    if (cfg.clip) {
      out.clip = out.clip ?? {};
      const sa = trimOrEmpty(cfg.clip.system_append);
      const ua = trimOrEmpty(cfg.clip.user_task_append);
      if (sa) out.clip.system_append = [out.clip.system_append, sa].filter(Boolean).join("\n\n");
      if (ua) out.clip.user_task_append = [out.clip.user_task_append, ua].filter(Boolean).join("\n\n");
      if (cfg.clip.steps) {
        out.clip.steps = out.clip.steps ?? {};
        for (const key of CLIP_STEP_KEYS) {
          const src = cfg.clip.steps[key];
          if (!src) continue;
          const prev = out.clip.steps[key] ?? {};
          const instr = trimOrEmpty(src.instruction);
          const headline = trimOrEmpty(src.headline_fixed);
          const cta = trimOrEmpty(src.cta_label_fixed);
          const prevInstr = trimOrEmpty(prev.instruction);
          out.clip.steps[key] = {
            instruction: instr ? [prevInstr, instr].filter(Boolean).join("\n\n") : prevInstr || undefined,
            headline_fixed: headline || trimOrEmpty(prev.headline_fixed) || undefined,
            cta_label_fixed: cta || trimOrEmpty(prev.cta_label_fixed) || undefined,
          };
        }
      }
    }
  }
  return out;
}

export function resolveFullSystemPrompt(config?: ForgeGenerationPromptConfig | null): string {
  const append = trimOrEmpty(config?.full?.system_append);
  if (!append) return PROTOTYPE_SYSTEM_PROMPT;
  return [
    "## ПРИОРИТЕТ: ИНСТРУКЦИИ ЛАБОРАТОРИИ",
    "Эти правки задаёт команда. При конфликте с дефолтной структурой ниже — следуй инструкциям лаборатории.",
    append,
    "---",
    PROTOTYPE_SYSTEM_PROMPT,
  ].join("\n\n");
}

export function applyFullUserPromptExtras(
  userPrompt: string,
  config?: ForgeGenerationPromptConfig | null,
): string {
  const append = trimOrEmpty(config?.full?.user_task_append);
  if (!append) return userPrompt;
  const labBlock = [
    "## ПРИОРИТЕТ: ЗАДАЧА ЛАБОРАТОРИИ",
    append,
  ].join("\n\n");
  const marker = "\n## ЗАДАЧА";
  const idx = userPrompt.indexOf(marker);
  if (idx >= 0) {
    return `${userPrompt.slice(0, idx + marker.length)}\n\n${labBlock}\n\n${userPrompt.slice(idx + marker.length).trimStart()}`;
  }
  return `${userPrompt}\n\n${labBlock}`;
}

export function resolveClipSystemPrompt(
  config?: ForgeGenerationPromptConfig | null,
  opts?: { hasUserReferences?: boolean },
): string {
  const base = clip4SystemInstruction(opts);
  const append = trimOrEmpty(config?.clip?.system_append);
  if (!append) return base;
  return [
    "## ПРИОРИТЕТ: ИНСТРУКЦИИ ЛАБОРАТОРИИ",
    "Эти правки задаёт команда. При конфликте с дефолтной структурой ниже — следуй инструкциям лаборатории.",
    append,
    "---",
    base,
  ].join("\n\n");
}

export function buildClipStepInstructionsBlock(
  config?: ForgeGenerationPromptConfig | null,
): string {
  const steps = config?.clip?.steps;
  if (!steps) return "";
  const lines: string[] = [];
  for (const key of CLIP_STEP_KEYS) {
    const instr = trimOrEmpty(steps[key]?.instruction);
    if (!instr) continue;
    lines.push(`### ${CLIP_STEP_LABELS[key]}`);
    lines.push(instr);
  }
  return lines.length ? lines.join("\n\n") : "";
}

export function buildClipLabTaskBlock(config?: ForgeGenerationPromptConfig | null): string {
  const userTaskAppend = trimOrEmpty(config?.clip?.user_task_append);
  const stepBlock = buildClipStepInstructionsBlock(config);
  const fixedBlock = buildClipFixedFieldsBlock(config);
  if (!userTaskAppend && !stepBlock && !fixedBlock) return "";

  return [
    "## ПРИОРИТЕТ: ЗАДАЧА ЛАБОРАТОРИИ",
    "Следуй этим требованиям для каждого шага. Они важнее generic-эталона и дефолтных формулировок в конце промпта.",
    fixedBlock,
    userTaskAppend,
    stepBlock,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildClipFixedFieldsBlock(config?: ForgeGenerationPromptConfig | null): string {
  const steps = config?.clip?.steps;
  if (!steps) return "";
  const lines: string[] = [
    "## ФИКСИРОВАННЫЕ ПОЛЯ (будут подставлены дословно — не меняй)",
  ];
  for (const key of CLIP_STEP_KEYS) {
    const step = steps[key];
    const headline = trimOrEmpty(step?.headline_fixed);
    const cta = trimOrEmpty(step?.cta_label_fixed);
    if (!headline && !cta) continue;
    lines.push(`### ${CLIP_STEP_LABELS[key]}`);
    if (headline) lines.push(`hero.headline = «${headline}»`);
    if (cta) {
      lines.push(
        key === "apply"
          ? `lead_form_personal.cta = «${cta}»`
          : `cta.label = «${cta}»`,
      );
    }
  }
  return lines.length > 1 ? lines.join("\n") : "";
}

export function applyClipStepFixes(
  content: Record<string, unknown>,
  config?: ForgeGenerationPromptConfig | null,
): Record<string, unknown> {
  const stepsCfg = config?.clip?.steps;
  if (!stepsCfg) return content;

  const stepsRaw = content.steps;
  if (!Array.isArray(stepsRaw)) return content;

  const steps = stepsRaw.map((raw) => {
    const step = { ...(raw as Record<string, unknown>) };
    const key = String(step.key ?? "") as ClipStepKey;
    const fixed = stepsCfg[key];
    if (!fixed) return step;

    const headline = trimOrEmpty(fixed.headline_fixed);
    const ctaLabel = trimOrEmpty(fixed.cta_label_fixed);

    if (headline) {
      step.hero = { ...((step.hero as Record<string, unknown> | undefined) ?? {}), headline };
    }

    if (ctaLabel) {
      if (key === "apply") {
        step.lead_form_personal = {
          ...((step.lead_form_personal as Record<string, unknown> | undefined) ?? {}),
          cta: ctaLabel,
        };
      } else {
        step.cta = { ...((step.cta as Record<string, unknown> | undefined) ?? {}), label: ctaLabel };
      }
    }

    return step;
  });

  return { ...content, steps };
}

export function summarizePromptsApplied(config?: ForgeGenerationPromptConfig | null): Record<string, unknown> {
  const clip = config?.clip;
  const stepKeys = CLIP_STEP_KEYS.filter((k) => trimOrEmpty(clip?.steps?.[k]?.instruction));
  const fixedHeadlines = CLIP_STEP_KEYS.filter((k) => trimOrEmpty(clip?.steps?.[k]?.headline_fixed));
  const fixedCtas = CLIP_STEP_KEYS.filter((k) => trimOrEmpty(clip?.steps?.[k]?.cta_label_fixed));
  return {
    clip_system_chars: trimOrEmpty(clip?.system_append).length,
    clip_user_chars: trimOrEmpty(clip?.user_task_append).length,
    clip_step_keys: stepKeys,
    clip_steps_count: stepKeys.length,
    clip_fixed_headlines: fixedHeadlines,
    clip_fixed_ctas: fixedCtas,
  };
}

export function buildRegenerateFreshBlock(
  previousContent: Record<string, unknown> | null | undefined,
  variationNote?: string | null,
): string {
  if (!previousContent) {
    return variationNote?.trim()
      ? `## ПЕРЕГЕНЕРАЦИЯ\n${variationNote.trim()}`
      : "";
  }

  const lines: string[] = [
    "## ПЕРЕГЕНЕРАЦИЯ — НОВАЯ ИДЕЯ",
    "Предыдущая версия прототипа уже была. Собери НОВЫЙ вариант:",
    "- другой угол hook и hero (не перефразируй дословно прошлые заголовки, если они не в блоке «ФИКСИРОВАННЫЕ ПОЛЯ»);",
    "- другие pain.points / подзаголовки / истории;",
    "- сохрани факты из KB, но смени подачу и метафоры.",
  ];

  const steps = previousContent.steps;
  if (Array.isArray(steps)) {
    lines.push("", "Кратко, что было в прошлой версии (не повторяй):");
    for (const raw of steps) {
      const step = raw as Record<string, unknown>;
      const key = String(step.key ?? "?");
      const hero = step.hero as { headline?: string } | undefined;
      const hl = trimOrEmpty(hero?.headline);
      if (hl) lines.push(`- ${key}: «${hl.slice(0, 120)}»`);
    }
  } else {
    const blocks = previousContent.blocks as Record<string, unknown> | undefined;
    const hero = blocks?.hero as { headline?: string } | undefined;
    const hl = trimOrEmpty(hero?.headline);
    if (hl) lines.push(`- прошлый hero: «${hl.slice(0, 160)}»`);
  }

  const note = trimOrEmpty(variationNote);
  if (note) {
    lines.push("", "Пожелание редактора к этой генерации:", note);
  }

  return lines.join("\n");
}

export function buildClipUserPromptParts(input: {
  kbSection: string;
  clipReference: string;
  scenarioSection: string;
  directionSlug: string | null;
  config?: ForgeGenerationPromptConfig | null;
  regenerateFreshBlock?: string;
  clipStepBlocksPrompt?: string;
}): string {
  const labTaskBlock = buildClipLabTaskBlock(input.config);
  const taskLines = [...DEFAULT_CLIP_USER_TASK_LINES];
  if (input.directionSlug) {
    taskLines.splice(2, 0, "Строго придерживайся выбранного направления — не подмешивай боли других тем.");
  }

  return [
    input.kbSection,
    input.clipReference,
    input.scenarioSection,
    input.regenerateFreshBlock,
    input.clipStepBlocksPrompt,
    "## ЗАДАЧА",
    labTaskBlock,
    ...taskLines,
    labTaskBlock
      ? "Дефолтные строки выше — только если в блоке «ПРИОРИТЕТ: ЗАДАЧА ЛАБОРАТОРИИ» не хватает детали."
      : "",
    input.clipStepBlocksPrompt
      ? "Блок «КОНСТРУКТОР БЛОКОВ CLIP-4» важнее generic-эталона по составу секций на каждом шаге."
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}
