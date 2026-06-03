import type { ForgeLabChatRole } from "./forgeLabChatSchema.ts";

const ROLE_INTROS: Record<ForgeLabChatRole, string> = {
  kb_curator: `Ты — куратор базы знаний Forge Lab. Отвечаешь только по фактам из KB и прототипа.
Помогаешь найти пробелы, объяснить откуда взялись формулировки, что добавить в базу.`,
  copy_editor: `Ты — редактор копирайтинга Forge Lab. Проверяешь тексты прототипа: клише, плейсхолдеры, off-topic отзывы.
Предлагаешь 1–2 альтернативы одного элемента, не переписываешь весь лендинг.`,
  test_strategist: `Ты — стратег A/B-тестов для лендингов под Яндекс.Директ.
Одна гипотеза за раз, минимальный объём трафика словами, что НЕ менять параллельно.`,
};

const SHARED_RULES = `## Общие правила
- Русский язык. Без «как языковая модель», без упоминания JSON/схемы.
- Единственный источник фактов о продукте — секция KB и blocks прототипа ниже.
- Если факта нет — скажи явно; не выдумывай цены, сроки, состав, гарантию.
- Один главный фокус за ответ. Коротко и по делу.
- Не публикуй и не меняй лендинг сам — только советуй (Regenerate, Lovable export, правка KB).
- Стоп-лист: NASA/космонавты, «верните лёгкость», телемагазин, квадратные скобки [...] в тексте LP.
- suggested_actions — максимум 2, только если уместно.
- ab_idea — заполняй только в роли test_strategist и когда спрашивают про тесты.`;

export function buildForgeLabChatSystem(role: ForgeLabChatRole): string {
  const r = ROLE_INTROS[role] ?? ROLE_INTROS.kb_curator;
  return `${r}\n\n${SHARED_RULES}`;
}

const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero",
  paradigm_shift: "Миф и правда",
  pain: "Боль",
  enemy_section: "Враг",
  solution: "Решение",
  transformation: "Трансформация",
  value: "Ценность",
  product: "Продукт",
  process: "Процесс",
  founder: "Основатель",
  comparison: "Сравнение",
  social_proof: "Отзывы",
  not_for: "Не для кого",
  objections: "Возражения",
  faq: "FAQ",
  future_pacing: "Future pacing",
  guarantee: "Гарантия",
  final_cta: "Финальный CTA",
  micro_copy: "Micro-copy",
};

export function summarizePrototypeContent(content: Record<string, unknown>): string {
  const meta = (content.meta ?? {}) as Record<string, unknown>;
  const blocks = (content.blocks ?? {}) as Record<string, unknown>;
  const lines: string[] = [];

  lines.push("### Мета прототипа");
  if (meta.project_name) lines.push(`- project_name: ${meta.project_name}`);
  if (meta.target_action) lines.push(`- target_action: ${meta.target_action}`);
  if (meta.tone_of_voice) lines.push(`- tone: ${meta.tone_of_voice}`);
  if (Array.isArray(meta.sequence)) lines.push(`- sequence: ${(meta.sequence as string[]).join(" → ")}`);
  if (Array.isArray(meta.voc_phrases)) {
    lines.push("- voc_phrases:");
    (meta.voc_phrases as string[]).slice(0, 7).forEach((p) => lines.push(`  · ${p}`));
  }

  lines.push("\n### Кратко по блокам");
  const seq = Array.isArray(meta.sequence) && meta.sequence.length
    ? (meta.sequence as string[])
    : Object.keys(blocks);

  for (const key of seq) {
    const bl = blocks[key];
    if (!bl || typeof bl !== "object") continue;
    const b = bl as Record<string, unknown>;
    const label = BLOCK_LABELS[key] ?? key;
    let hint = "";
    if (typeof b.headline === "string") hint = b.headline;
    else if (typeof b.title === "string") hint = b.title;
    else if (key === "hero" && typeof b.story_opening === "string") {
      hint = b.story_opening.slice(0, 120) + "…";
    }
    if (hint) lines.push(`- **${label}**: ${hint.slice(0, 200)}`);
  }

  return lines.join("\n").slice(0, 8000);
}

export function extractFocusBlock(
  content: Record<string, unknown>,
  focusBlock?: string,
): string {
  if (!focusBlock?.trim()) return "";
  const blocks = (content.blocks ?? {}) as Record<string, unknown>;
  const bl = blocks[focusBlock.trim()];
  if (!bl) return "";
  return JSON.stringify(bl, null, 2).slice(0, 4000);
}

export function buildForgeLabChatUserPrompt(args: {
  productName: string;
  prototypeName: string;
  prototypeMeta: Record<string, unknown>;
  kbSection: string;
  contentSummary: string;
  focusBlockJson: string;
  historyText: string;
  message: string;
  versionNumber?: number;
  directionTitle?: string;
}): string {
  const parts: string[] = [];
  parts.push(`Продукт: ${args.productName}`);
  parts.push(`Прототип: ${args.prototypeName}${args.versionNumber ? ` (версия #${args.versionNumber})` : ""}`);
  if (args.directionTitle) parts.push(`Направление: ${args.directionTitle}`);
  parts.push(`Статус: ${args.prototypeMeta.status ?? "draft"}`);
  if (args.prototypeMeta.slug) parts.push(`Slug: ${args.prototypeMeta.slug}`);
  if (args.prototypeMeta.format) parts.push(`Format: ${args.prototypeMeta.format}`);

  parts.push("\n## База знаний\n" + args.kbSection.slice(0, 12000));
  parts.push("\n## Прототип (summary)\n" + args.contentSummary);

  if (args.focusBlockJson) {
    parts.push("\n## Фокус-блок (полный JSON)\n```json\n" + args.focusBlockJson + "\n```");
  }

  if (args.historyText.trim()) {
    parts.push("\n## История диалога\n" + args.historyText);
  }

  parts.push("\n## Новое сообщение пользователя\n" + args.message.slice(0, 2000));
  parts.push("\nВерни JSON по схеме emit_forge_chat.");

  return parts.join("\n");
}
