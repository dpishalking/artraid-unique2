/**
 * Адаптер Forge Knowledge Base → PrototypeBrief для generate-prototype prompt pipeline.
 */
import type { ForgeKbRow } from "./forgeKbPrompt.ts";
import type { PrototypeBrief } from "./prototypeUserPrompt.ts";

function pick(obj: Record<string, unknown> | undefined, ...keys: string[]): string {
  if (!obj) return "";
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export function forgeKbToBrief(
  kb: ForgeKbRow,
  opts: { projectName: string; scenarioId?: string | null; format?: string | null },
): PrototypeBrief {
  const product = (kb.product ?? {}) as Record<string, unknown>;
  const audience = (kb.audience ?? {}) as Record<string, unknown>;
  const usp = (kb.usp ?? {}) as Record<string, unknown>;
  const tone = (kb.tone ?? {}) as Record<string, unknown>;
  const topOffer = kb.offers?.[0];
  const topCompetitor = kb.competitors?.[0];

  return {
    scenario_id: opts.scenarioId ?? undefined,
    answers: {},
    niche: pick(product, "niche", "category", "segment") || pick(usp, "niche") || opts.projectName,
    product: pick(product, "name", "title", "product") || opts.projectName,
    audience:
      pick(audience, "description", "summary", "who", "profile") ||
      (Object.keys(audience).length ? JSON.stringify(audience).slice(0, 800) : ""),
    offer:
      pick(usp, "offer", "promise", "headline", "benefit", "main_promise") ||
      pick(product, "offer", "description"),
    price: topOffer?.price ?? pick(usp, "price") ?? pick(product, "price") ?? "[уточнить у клиента]",
    guarantee: pick(usp, "guarantee") ?? pick(product, "guarantee"),
    mechanism:
      pick(usp, "mechanism", "unique_mechanism", "how_it_works", "method") ??
      pick(product, "mechanism"),
    bigidea: pick(usp, "big_idea", "bigidea", "idea", "angle", "provocation"),
    enemy: pick(usp, "enemy", "villain") ?? topCompetitor?.name,
    traffic: pick(tone, "traffic", "awareness", "traffic_source", "temperature"),
    format:
      (opts.format && opts.format.trim()) ||
      pick(tone, "format", "style", "landing_format") ||
      "classic",
  };
}

/** Контекст конкурентов и референсов для секции АНАЛИЗ КОНКУРЕНТА. */
export function buildForgeCompetitorContext(kb: ForgeKbRow): string {
  const parts: string[] = [];

  if (kb.competitors?.length) {
    parts.push("### Конкуренты из базы знаний");
    kb.competitors.forEach((c) => {
      parts.push(`- ${c.name}${c.difference ? ` — отличие нашего продукта: ${c.difference}` : ""}`);
    });
    parts.push("");
  }

  const refs = (kb.reference_sites ?? []).slice(0, 4);
  for (const ref of refs) {
    const excerpt = (ref.scraped_text ?? ref.meaning_notes ?? "").slice(0, 3500).trim();
    if (!excerpt) continue;
    parts.push(`### Референс: ${ref.url}${ref.label ? ` (${ref.label})` : ""}`);
    if (ref.note) parts.push(`Зачем смотрим: ${ref.note}`);
    parts.push(excerpt);
    parts.push("");
  }

  return parts.join("\n").trim();
}
