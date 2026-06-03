/**
 * Сборка промпт-секции из Knowledge Base для генерации прототипов Лаборатории.
 * Используется forge-generate-prototype.
 */

export type ForgeKbRow = {
  product_id: string;
  product: Record<string, unknown>;
  audience: Record<string, unknown>;
  usp: Record<string, unknown>;
  pains: Array<{ text: string; weight?: number }>;
  voc: string[];
  fab_matrix: Array<{ feature: string; advantage: string; benefit: string }>;
  objections: Array<{ text: string; answer?: string }>;
  proofs: Array<{ type: string; title: string; body?: string }>;
  competitors: Array<{ name: string; difference?: string }>;
  offers: Array<{ name: string; price?: string }>;
  tone: Record<string, unknown>;
  source_documents?: Array<{ filename: string; text: string; char_count?: number }>;
  reference_sites?: Array<{
    url: string;
    label?: string;
    note?: string;
    scraped_text?: string;
    meaning_notes?: string;
  }>;
};

export type ForgeReviewRow = {
  text: string;
  author?: string | null;
  rating?: number | null;
  tags?: string[];
  is_starred?: boolean;
};

function jsonOrDash(v: unknown): string {
  if (!v || (typeof v === "object" && Object.keys(v as object).length === 0)) return "(не заполнено)";
  return JSON.stringify(v, null, 2);
}

export type ForgeKbPromptOptions = {
  /** Не дублировать source_documents — они уже в блоке clip-референсов */
  omitSourceDocuments?: boolean;
  /** Не дублировать reference_sites — они уже в блоке clip-референсов */
  omitReferenceSites?: boolean;
};

export function buildForgeKbPromptSection(
  kb: ForgeKbRow,
  reviews: ForgeReviewRow[],
  opts?: ForgeKbPromptOptions,
): string {
  const lines: string[] = [];
  lines.push("## БАЗА ЗНАНИЙ ПРОДУКТА (Knowledge Base)");
  lines.push("");

  const dirTitle = (kb as ForgeKbRow & { _direction_title?: string })._direction_title;
  if (dirTitle) {
    lines.push(`### Активное направление лендинга: ${dirTitle}`);
    lines.push(
      "Ниже — общая база продукта + слой этого направления (боли, угол, VOC). Не смешивай с другими направлениями.",
    );
    lines.push("");
  }

  if (!opts?.omitSourceDocuments && kb.source_documents?.length) {
    lines.push("### Исходные материалы (выдержки)");
    kb.source_documents.slice(-5).forEach((doc) => {
      const excerpt = doc.text.slice(0, 2500).replace(/\s+/g, " ").trim();
      lines.push(`#### ${doc.filename}`);
      lines.push(excerpt);
      lines.push("");
    });
  }

  if (!opts?.omitReferenceSites && kb.reference_sites?.length) {
    lines.push("### Референсы по смыслу (структура и формулировки — не факты чужого продукта)");
    kb.reference_sites.slice(-6).forEach((ref) => {
      const title = ref.label ? `${ref.url} — ${ref.label}` : ref.url;
      lines.push(`#### ${title}`);
      if (ref.note) lines.push(`Зачем: ${ref.note}`);
      const excerpt = (ref.meaning_notes ?? ref.scraped_text ?? "").slice(0, 2000).replace(/\s+/g, " ").trim();
      if (excerpt) lines.push(excerpt);
      lines.push("");
    });
  }

  lines.push("### Продукт");
  lines.push(jsonOrDash(kb.product));
  lines.push("");
  lines.push("### Аудитория");
  lines.push(jsonOrDash(kb.audience));
  lines.push("");
  lines.push("### УТП");
  lines.push(jsonOrDash(kb.usp));
  lines.push("");

  if (kb.pains?.length) {
    lines.push("### Боли (отсортированы по весу)");
    [...kb.pains]
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      .forEach((p) => lines.push(`- ${p.text}${typeof p.weight === "number" ? ` (вес ${p.weight})` : ""}`));
    lines.push("");
  }

  if (kb.fab_matrix?.length) {
    lines.push("### СДВ-матрица (Свойство → Действие → Выгода)");
    kb.fab_matrix.forEach((r) =>
      lines.push(`- ${r.feature} → ${r.advantage} → ${r.benefit}`),
    );
    lines.push("");
  }

  if (kb.objections?.length) {
    lines.push("### Возражения");
    kb.objections.forEach((o) => {
      lines.push(`- ${o.text}`);
      if (o.answer) lines.push(`  Ответ: ${o.answer}`);
    });
    lines.push("");
  }

  if (kb.proofs?.length) {
    lines.push("### Доказательства");
    kb.proofs.forEach((p) => lines.push(`- [${p.type}] ${p.title}${p.body ? ` — ${p.body}` : ""}`));
    lines.push("");
  }

  if (kb.voc?.length) {
    lines.push("### Голос клиента (VOC) — используй эти формулировки в заголовках");
    kb.voc.slice(0, 20).forEach((v) => lines.push(`- "${v}"`));
    lines.push("");
  }

  if (reviews?.length) {
    lines.push("### Реальные отзывы клиентов");
    const starred = reviews.filter((r) => r.is_starred);
    const pool = starred.length ? starred : reviews;
    pool.slice(0, 25).forEach((r) => {
      const author = r.author ? ` — ${r.author}` : "";
      const rating = typeof r.rating === "number" ? ` (★${r.rating})` : "";
      lines.push(`- "${r.text.slice(0, 400)}"${author}${rating}`);
    });
    lines.push("");
  }

  if (kb.tone && Object.keys(kb.tone).length) {
    lines.push("### Тон голоса");
    lines.push(jsonOrDash(kb.tone));
    lines.push("");
  }

  lines.push("ВАЖНО:");
  lines.push("- Используй VOC и реальные фразы из отзывов в заголовках hero и в pain.");
  lines.push("- В заголовках и копирайтинге опирайся на самые тяжёлые боли (высокий вес).");
  lines.push("- Каждая выгода должна быть из СДВ-матрицы — не выдумывай характеристики.");
  lines.push("- Возражения закрывай в objections блоке используя данные ответы.");
  lines.push("");
  return lines.join("\n");
}
