import type { Hypothesis } from "./api";
import { parseHypothesisResult } from "./api";

/** Где тестируем гипотезу — не только сайт. */
export type HypothesisChannel = "website" | "funnel" | "sales" | "offer" | "creative" | "research";

export type ChannelConfig = {
  id: HypothesisChannel;
  label: string;
  shortLabel: string;
  sourceType: string;
  type: string;
  metricPlaceholder: string;
  guardrailPlaceholder: string;
  implementHint: string;
  resultPlaceholderBefore: string;
  resultPlaceholderAfter: string;
};

export const HYPOTHESIS_CHANNELS: ChannelConfig[] = [
  {
    id: "website",
    label: "Сайт / лендинг",
    shortLabel: "Сайт",
    sourceType: "website_audit",
    type: "packaging",
    metricPlaceholder: "CR заявки, CPL, bounce rate",
    guardrailPlaceholder: "CPL ≤ 900, bounce ≤ 60%",
    implementHint: "Hero, оффер, CTA, форма на первом экране",
    resultPlaceholderBefore: "0.9",
    resultPlaceholderAfter: "2.4",
  },
  {
    id: "funnel",
    label: "Воронка",
    shortLabel: "Воронка",
    sourceType: "funnel",
    type: "funnel",
    metricPlaceholder: "CR этапа, доходимость, CPL, время до оплаты",
    guardrailPlaceholder: "отвал на этапе ≤ 40%, CPL не выше X",
    implementHint: "Последовательность касаний, оффер на этапе, триггеры, автоматизация",
    resultPlaceholderBefore: "12",
    resultPlaceholderAfter: "18",
  },
  {
    id: "sales",
    label: "Отдел продаж",
    shortLabel: "Продажи",
    sourceType: "sales",
    type: "sales",
    metricPlaceholder: "конверсия в сделку, средний чек, цикл сделки, % дозвона",
    guardrailPlaceholder: "цикл сделки ≤ 14 дней, отказ ≤ 30%",
    implementHint: "Скрипт, квалификация, follow-up, CRM-стадии, возражения",
    resultPlaceholderBefore: "18",
    resultPlaceholderAfter: "27",
  },
  {
    id: "offer",
    label: "Оффер / упаковка",
    shortLabel: "Оффер",
    sourceType: "offer",
    type: "offer",
    metricPlaceholder: "CR, заявки, CTR креатива",
    guardrailPlaceholder: "CPL в пределах unit-экономики",
    implementHint: "УТП, гарантия, бонус, формулировка цены",
    resultPlaceholderBefore: "1.2",
    resultPlaceholderAfter: "2.0",
  },
  {
    id: "creative",
    label: "Креатив / канал",
    shortLabel: "Креатив",
    sourceType: "creative",
    type: "creative",
    metricPlaceholder: "CTR, CPC, CPL, ROMI",
    guardrailPlaceholder: "CPC ≤ X, spam leads ≤ Y%",
    implementHint: "Объявление, посадка, сегмент, формат",
    resultPlaceholderBefore: "0.8",
    resultPlaceholderAfter: "1.4",
  },
  {
    id: "research",
    label: "Исследование / инсайт",
    shortLabel: "Research",
    sourceType: "research",
    type: "research",
    metricPlaceholder: "гипотеза спроса, NPS, качество лидов",
    guardrailPlaceholder: "не ухудшить текущий CR",
    implementHint: "Интервью, опрос, разбор звонков, CustDev",
    resultPlaceholderBefore: "—",
    resultPlaceholderAfter: "—",
  },
];

export function getChannelConfig(id: HypothesisChannel): ChannelConfig {
  return HYPOTHESIS_CHANNELS.find((c) => c.id === id) ?? HYPOTHESIS_CHANNELS[0];
}

export function resolveHypothesisChannel(h: Hypothesis): HypothesisChannel {
  const parsed = parseHypothesisResult(h);
  const metaSource = parsed.source?.toLowerCase() ?? "";
  const type = (h.type ?? "").toLowerCase();
  const src = (h.source_type ?? "").toLowerCase();

  if (metaSource.includes("funnel") || type === "funnel" || src.includes("funnel")) return "funnel";
  if (metaSource.includes("sales") || type === "sales" || src.includes("sales")) return "sales";
  if (metaSource.includes("creative") || type === "creative" || src.includes("creative")) return "creative";
  if (metaSource.includes("research") || type === "research" || src.includes("research")) return "research";
  if (metaSource.includes("offer") || type === "offer") return "offer";
  if (
    src.includes("website") ||
    src.includes("audit") ||
    type === "packaging" ||
    type === "conversion"
  ) {
    return "website";
  }
  return "website";
}

export function channelLabel(h: Hypothesis): string {
  return getChannelConfig(resolveHypothesisChannel(h)).shortLabel;
}
