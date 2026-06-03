import type { OfferResult } from "./types";

export function formatBestOfferCopy(result: OfferResult): string {
  const { headline, subheadline, cta, microcopy } = result.bestOffer;
  return [headline, subheadline, cta, microcopy].filter(Boolean).join("\n\n");
}

export function formatFullOfferDocument(result: OfferResult): string {
  const sections: string[] = [
    "═══ ЛУЧШИЙ ОФФЕР ═══",
    formatBestOfferCopy(result),
    "",
    "═══ ПОЧЕМУ РАБОТАЕТ ═══",
    ...result.whyItWorks.map((w) => `• ${w}`),
    "",
    "═══ УГЛЫ ═══",
    `Через боль: ${result.angles.pain}`,
    `Через результат: ${result.angles.result}`,
    `Через потерю: ${result.angles.loss}`,
    `Через врага: ${result.angles.enemy}`,
    `Через механизм: ${result.angles.mechanism}`,
    `Через диагностику: ${result.angles.diagnostic}`,
    `Через срочность: ${result.angles.urgency}`,
  ];

  if (result.formatVersions.landing) {
    const l = result.formatVersions.landing;
    sections.push("", "═══ ЛЕНДИНГ ═══", l.headline, l.subheadline, l.cta, l.microcopy);
  }
  if (result.formatVersions.post) {
    const p = result.formatVersions.post;
    sections.push("", "═══ ПОСТ ═══", p.hook, p.body, p.cta);
  }
  if (result.alternativeHeadlines.length) {
    sections.push("", "═══ АЛЬТЕРНАТИВНЫЕ ЗАГОЛОВКИ ═══", ...result.alternativeHeadlines.map((h, i) => `${i + 1}. ${h}`));
  }
  if (result.alternativeCtas.length) {
    sections.push("", "═══ АЛЬТЕРНАТИВНЫЕ CTA ═══", ...result.alternativeCtas.map((c, i) => `${i + 1}. ${c}`));
  }

  return sections.join("\n");
}
