import type { Audit } from "@/components/AuditDashboard";
import type { LossMapCategory, LossMapCategoryId, LossMapData } from "./types";

function hostnameOf(url?: string): string {
  if (!url) return "ваш сайт";
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] || "ваш сайт";
  }
}

function metricScore(audit: Audit, name: string): number {
  const m = audit.diagnosis.metrics.find((x) => x.name === name);
  return m?.score ?? 5;
}

/** Чем ниже оценка 0–10, тем выше «потеря» категории. */
function lossWeight(score: number): number {
  return Math.max(0, 10 - score);
}

function speedLossWeight(audit: Audit): number {
  const text = [
    ...audit.problems.map((p) => `${p.title} ${p.whyItHurts}`),
    ...audit.blocks.map((b) => `${b.name} ${b.problem}`),
  ]
    .join(" ")
    .toLowerCase();
  if (/скорост|мобил|загрузк|lcp|cls|тормоз|медлен/i.test(text)) {
    return Math.max(2, lossWeight(metricScore(audit, "Действие")) * 0.6);
  }
  const friction = audit.meclabsScore?.friction;
  if (typeof friction === "number" && friction < 6) return 3;
  return 1.5;
}

function normalizePercents(weights: Record<LossMapCategoryId, number>): LossMapCategory[] {
  const defs: { id: LossMapCategoryId; label: string; hint: string }[] = [
    { id: "offer", label: "Оффер", hint: "Первый экран и ценность" },
    { id: "trust", label: "Доверие", hint: "Кейсы, доказательства, страхи" },
    { id: "form", label: "Форма и CTA", hint: "Путь к заявке" },
    { id: "speed", label: "Скорость и UX", hint: "Трение и удобство" },
  ];
  const sum = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  return defs.map((d) => ({
    ...d,
    percent: Math.max(5, Math.round((weights[d.id] / sum) * 100)),
  }));
}

function rebalanceTo100(categories: LossMapCategory[]): LossMapCategory[] {
  const sum = categories.reduce((a, c) => a + c.percent, 0);
  if (sum === 100) return categories;
  const delta = 100 - sum;
  const idx = categories.reduce(
    (best, c, i, arr) => (c.percent > arr[best].percent ? i : best),
    0,
  );
  return categories.map((c, i) => (i === idx ? { ...c, percent: c.percent + delta } : c));
}

function collectTopFixes(audit: Audit): string[] {
  const fixes: string[] = [];
  if (audit.quickestWin?.action?.trim()) fixes.push(audit.quickestWin.action.trim());

  for (const p of audit.problems) {
    if (fixes.length >= 3) break;
    if (p.severity !== "critical" && p.severity !== "important") continue;
    const line = p.howToFix?.[0]?.trim() || p.title?.trim();
    if (line && !fixes.includes(line)) fixes.push(line);
  }

  for (const q of audit.roadmap?.quickWins ?? []) {
    if (fixes.length >= 3) break;
    const line = q.action?.trim();
    if (line && !fixes.includes(line)) fixes.push(line);
  }

  return fixes.slice(0, 3);
}

export function buildLossMap(audit: Audit, siteUrl?: string): LossMapData {
  const clarity = metricScore(audit, "Понятность");
  const value = metricScore(audit, "Ценность");
  const trust = metricScore(audit, "Доверие");
  const action = metricScore(audit, "Действие");

  const weights: Record<LossMapCategoryId, number> = {
    offer: (lossWeight(clarity) + lossWeight(value)) / 2,
    trust: lossWeight(trust),
    form: lossWeight(action),
    speed: speedLossWeight(audit),
  };

  const categories = rebalanceTo100(normalizePercents(weights));
  const topCategory = [...categories].sort((a, b) => b.percent - a.percent)[0];
  const hostname = hostnameOf(siteUrl);

  return {
    hostname,
    totalLossLabel: audit.diagnosis.estimatedLossPercent || "—",
    headline: topCategory
      ? `Больше всего заявок теряется на этапе «${topCategory.label.toLowerCase()}»`
      : "Карта потерь заявок по сайту",
    categories,
    topFixes: collectTopFixes(audit),
  };
}
