import { fetchSiteText, normalizeSiteUrl } from "./fetchSiteText.ts";

export type ReferenceSiteInput = {
  url: string;
  label?: string;
  note?: string;
};

export type ReferenceSiteRecord = {
  id: string;
  url: string;
  label?: string;
  note?: string;
  scraped_text?: string;
  meaning_notes?: string;
  added_at: string;
};

const MAX_REFERENCES = 6;
const MAX_REFERENCE_TEXT = 12_000;

export async function fetchReferenceSitesForKb(
  inputs: ReferenceSiteInput[],
): Promise<{ records: ReferenceSiteRecord[]; promptBlock: string; errors: string[] }> {
  const records: ReferenceSiteRecord[] = [];
  const errors: string[] = [];
  const promptParts: string[] = [];
  const now = new Date().toISOString();

  const clean = inputs
    .map((r) => ({
      url: normalizeSiteUrl(String(r.url ?? "").trim()),
      label: r.label ? String(r.label).trim().slice(0, 120) : undefined,
      note: r.note ? String(r.note).trim().slice(0, 400) : undefined,
    }))
    .filter((r) => r.url.length > 0)
    .slice(0, MAX_REFERENCES);

  for (const ref of clean) {
    try {
      const scraped = await fetchSiteText(ref.url);
      if (!scraped.trim()) {
        errors.push(`${ref.url}: пустая страница`);
        continue;
      }
      const text = scraped.slice(0, MAX_REFERENCE_TEXT);
      records.push({
        id: crypto.randomUUID(),
        url: ref.url,
        label: ref.label,
        note: ref.note,
        scraped_text: text,
        added_at: now,
      });
      promptParts.push(
        [
          `--- РЕФЕРЕНС САЙТ: ${ref.url} ---`,
          ref.label ? `Метка: ${ref.label}` : "",
          ref.note ? `Зачем смотрим: ${ref.note}` : "",
          "Текст страницы (для паттернов смысла, не для фактов продукта):",
          text,
        ]
          .filter(Boolean)
          .join("\n"),
      );
    } catch (e) {
      errors.push(`${ref.url}: ${e instanceof Error ? e.message : "не удалось загрузить"}`);
    }
  }

  const promptBlock = promptParts.length
    ? [
        "РЕФЕРЕНСЫ ПО СМЫСЛУ (чужие сайты — только структура, hook, угол, тон):",
        promptParts.join("\n\n"),
      ].join("\n\n")
    : "";

  return { records, promptBlock, errors };
}

export const REFERENCE_SITES_SYSTEM_RULES =
  "Блоки «РЕФЕРЕНС САЙТ» — бери паттерны смысла: структуру экранов, тип заголовка, угол боли, social proof.\n" +
  "НЕ переноси факты, цены, обещания и названия чужого продукта — только приёмы под наш продукт из материалов клиента.";
