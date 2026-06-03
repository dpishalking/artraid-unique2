/**
 * Детерминированная сборка виджетов niche snapshot из audit_payload конкурентов
 * и полного audit пользователя (analysis_logs).
 */

export type AwarenessLevel = "unaware" | "problem" | "solution" | "product" | "most";

export type SiteCard = {
  id: string;
  label: string;
  url?: string | null;
  is_self: boolean;
  awareness: AwarenessLevel;
  sophistication: number;
  scores: {
    hormozi: number | null;
    meclabs: number | null;
    eisenberg: number | null;
    storybrand: number | null;
    hormozi_axes?: {
      dream?: number;
      belief?: number;
      speed?: number;
      ease?: number;
    };
  };
  first_screen: {
    headline: string | null;
    sub_headline: string | null;
    primary_cta: string | null;
  };
  trust: Record<string, string>;
  cta: { verb: string | null; count_on_page: number | null };
  positioning: {
    role: string | null;
    promise: string | null;
    promise_intensity: number | null;
  };
  pricing: { extracted_price: string | null; model: string | null };
  proof_inventory: string[];
  /** 11 критериев конкурентной разведки (PDF-шаблон). */
  intel: IntelRecord;
};

type IntelRecord = {
  revenue: string;
  main_product: string;
  additional_products: string;
  extraordinary: string;
  traffic_channels: string;
  offers: string;
  sales_funnel: string;
  conversion_elements: string;
  martech: string;
  marketing_team: string;
};

const EMPTY_INTEL: IntelRecord = {
  revenue: "—",
  main_product: "—",
  additional_products: "—",
  extraordinary: "—",
  traffic_channels: "—",
  offers: "—",
  sales_funnel: "—",
  conversion_elements: "—",
  martech: "—",
  marketing_team: "—",
};

function strIntel(v: unknown, fallback = "—"): string {
  const s = v == null ? "" : String(v).trim();
  return s || fallback;
}

function intelFromPayload(payload: Record<string, unknown>): IntelRecord {
  return {
    revenue: strIntel(payload.revenue),
    main_product: strIntel(payload.main_product),
    additional_products: strIntel(payload.additional_products),
    extraordinary: strIntel(payload.extraordinary),
    traffic_channels: strIntel(payload.traffic_channels),
    offers: strIntel(payload.offers),
    sales_funnel: strIntel(payload.sales_funnel),
    conversion_elements: strIntel(payload.conversion_elements),
    martech: strIntel(payload.martech),
    marketing_team: strIntel(payload.marketing_team),
  };
}

const TRUST_KEYS = [
  "recipivity",
  "reciprocity",
  "commitment",
  "social_proof",
  "authority",
  "liking",
  "scarcity",
] as const;

const TRUST_LABELS: Record<string, string> = {
  reciprocity: "Reciprocity",
  commitment: "Commitment",
  social_proof: "Social proof",
  authority: "Authority",
  liking: "Liking",
  scarcity: "Scarcity",
};

export function normalizeAwareness(raw: unknown): AwarenessLevel {
  const s = String(raw ?? "").toLowerCase();
  if (/unaware|незнаком|не осведом/i.test(s)) return "unaware";
  if (/problem|проблем/i.test(s)) return "problem";
  if (/solution|решени/i.test(s)) return "solution";
  if (/product|продукт/i.test(s)) return "product";
  if (/most|максим|сам осведом/i.test(s)) return "most";
  return "solution";
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  const s = v == null ? "" : String(v).trim();
  return s || null;
}

function clampSoph(n: number | null): number {
  if (n == null) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

/** Карточка из compact audit_payload (analyze-competitor). */
export function siteCardFromCompetitorAudit(
  competitorId: string,
  label: string,
  payload: Record<string, unknown>,
  scoresRow: Record<string, unknown>,
  siteUrl?: string | null,
): SiteCard {
  const fs = (payload.first_screen ?? {}) as Record<string, unknown>;
  const sc = (payload.scores ?? {}) as Record<string, unknown>;
  const axes = (sc.hormozi_axes ?? {}) as Record<string, unknown>;
  const trust = (payload.trust ?? {}) as Record<string, unknown>;
  const cta = (payload.cta ?? {}) as Record<string, unknown>;
  const pos = (payload.positioning ?? {}) as Record<string, unknown>;
  const pricing = (payload.pricing ?? {}) as Record<string, unknown>;
  const proofs = Array.isArray(payload.proof_inventory)
    ? payload.proof_inventory.map((x) => String(x)).filter(Boolean)
    : [];

  return {
    id: competitorId,
    label,
    url: siteUrl ?? null,
    is_self: false,
    awareness: normalizeAwareness(payload.awareness ?? scoresRow.awareness),
    sophistication: clampSoph(num(payload.sophistication) ?? num(scoresRow.sophistication)),
    scores: {
      hormozi: num(sc.hormozi) ?? num(scoresRow.hormozi),
      meclabs: num(sc.meclabs) ?? num(scoresRow.meclabs),
      eisenberg: num(sc.eisenberg) ?? num(scoresRow.eisenberg),
      storybrand: num(sc.storybrand) ?? num(scoresRow.storybrand),
      hormozi_axes: {
        dream: num(axes.dream) ?? undefined,
        belief: num(axes.belief) ?? undefined,
        speed: num(axes.speed) ?? undefined,
        ease: num(axes.ease) ?? undefined,
      },
    },
    first_screen: {
      headline: str(fs.headline),
      sub_headline: str(fs.sub_headline),
      primary_cta: str(fs.primary_cta),
    },
    trust: Object.fromEntries(
      ["reciprocity", "commitment", "social_proof", "authority", "liking", "scarcity"].map((k) => [
        k,
        str(trust[k]) ?? "none",
      ]),
    ),
    cta: {
      verb: str(cta.verb),
      count_on_page: num(cta.count_on_page),
    },
    positioning: {
      role: str(pos.role) ?? str(scoresRow.positioning_role),
      promise: str(pos.promise),
      promise_intensity: num(pos.promise_intensity),
    },
    pricing: {
      extracted_price: str(pricing.extracted_price),
      model: str(pricing.model),
    },
    proof_inventory: proofs,
    intel: intelFromPayload(payload),
  };
}

/** Карточка «вы» из полного audit (analyze-site). */
export function siteCardFromUserAudit(
  auditId: string,
  label: string,
  audit: Record<string, unknown>,
  siteUrl?: string | null,
): SiteCard {
  const offer = (audit.offerScore ?? {}) as Record<string, unknown>;
  const meclabs = (audit.meclabsScore ?? {}) as Record<string, unknown>;
  const market = (audit.marketContext ?? {}) as Record<string, unknown>;
  const rewrite = (audit.firstScreenRewrite ?? {}) as Record<string, unknown>;

  const hormoziTotal = num(offer.totalScore);
  const meclabsTotal = num(meclabs.score);

  return {
    id: auditId,
    label,
    url: siteUrl ?? null,
    is_self: true,
    awareness: normalizeAwareness(market.awarenessLevel),
    sophistication: clampSoph(num(market.sophisticationLevel)),
    scores: {
      hormozi: hormoziTotal,
      meclabs: meclabsTotal,
      eisenberg: null,
      storybrand: null,
      hormozi_axes: {
        dream: num(offer.dream) ?? undefined,
        belief: num(offer.likelihood) ?? undefined,
        speed: num(offer.timeDelay) ?? undefined,
        ease: num(offer.effort) ?? undefined,
      },
    },
    first_screen: {
      headline: str(rewrite.h1),
      sub_headline: str(rewrite.subtitle),
      primary_cta: str(rewrite.cta),
    },
    trust: {},
    cta: { verb: null, count_on_page: null },
    positioning: {
      role: null,
      promise: str(market.uniqueMechanism),
      promise_intensity: hormoziTotal,
    },
    pricing: { extracted_price: null, model: null },
    proof_inventory: rewrite.proofNearby ? [String(rewrite.proofNearby)] : [],
    intel: userIntelFromAudit(audit),
  };
}

/** Черновик разведки по вашему сайту из полного audit (analyze-site). */
export function userIntelFromAudit(audit: Record<string, unknown>): IntelRecord {
  const offer = (audit.offerScore ?? {}) as Record<string, unknown>;
  const market = (audit.marketContext ?? {}) as Record<string, unknown>;
  const rewrite = (audit.firstScreenRewrite ?? {}) as Record<string, unknown>;
  const ctaPath = (audit.ctaPath ?? {}) as Record<string, unknown>;
  const growth = (audit.growthPotential ?? {}) as Record<string, unknown>;
  const diag = (audit.diagnosis ?? {}) as Record<string, unknown>;

  const mainProduct = [
    rewrite.h1 ? `H1: ${str(rewrite.h1)}` : null,
    rewrite.subtitle ? str(rewrite.subtitle) : null,
    offer.verdict ? `Оффер: ${str(offer.verdict)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const extraordinary = [
    diag.mainLever ? str(diag.mainLever) : null,
    market.uniqueMechanism ? `Механизм: ${str(market.uniqueMechanism)}` : null,
    offer.biggestLever ? str(offer.biggestLever) : null,
  ]
    .filter(Boolean)
    .join(" ");

  const conversion = [
    rewrite.cta ? `CTA: ${str(rewrite.cta)}` : null,
    rewrite.microtext ? str(rewrite.microtext) : null,
    rewrite.proofNearby ? `Proof: ${str(rewrite.proofNearby)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const funnel = [
    ctaPath.leadsTo ? `После кнопки: ${str(ctaPath.leadsTo)}` : null,
    ctaPath.friction ? `Трение: ${str(ctaPath.friction)}` : null,
    ctaPath.afterForm ? `После формы: ${str(ctaPath.afterForm)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    revenue: "Не раскрывается (личный сайт) · оценка по аудиту конверсии",
    main_product: mainProduct || "—",
    additional_products: "См. полный аудит сайта · блоки и roadmap в отчёте",
    extraordinary: extraordinary || str(diag.mainProblem) || "—",
    traffic_channels: "По сайту: определите из вашей аналитики (в аудите не снято)",
    offers: growth.revenueLogic ? str(growth.revenueLogic) : "—",
    sales_funnel: funnel || "—",
    conversion_elements: conversion || "—",
    martech: "По коду страницы в аудите не снято · проверьте Метрику/CRM вручную",
    marketing_team: "Ваш проект · не конкурент",
  };
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function top(nums: number[]): number {
  return nums.length ? Math.max(...nums) : 0;
}

const AWARENESS_ORDER: AwarenessLevel[] = ["unaware", "problem", "solution", "product", "most"];

export function buildArtifactsFromSiteCards(cards: SiteCard[]): Record<string, unknown> {
  const self = cards.find((c) => c.is_self) ?? null;
  const competitors = cards.filter((c) => !c.is_self);

  const positioning_map = {
    points: cards.map((c) => ({
      competitor_id: c.id,
      label: c.label,
      awareness: c.awareness,
      sophistication: c.sophistication,
      is_self: c.is_self,
    })),
    empty_zones: findEmptyZones(cards),
  };

  const axes = ["Dream", "Belief", "Speed", "Ease"];
  const youAxes = self?.scores.hormozi_axes
    ? [
        self.scores.hormozi_axes.dream ?? self.scores.hormozi ?? 0,
        self.scores.hormozi_axes.belief ?? 0,
        self.scores.hormozi_axes.speed ?? 0,
        self.scores.hormozi_axes.ease ?? 0,
      ]
    : self?.scores.hormozi != null
      ? [self.scores.hormozi, self.scores.hormozi, self.scores.hormozi, self.scores.hormozi]
      : [0, 0, 0, 0];

  const compAxesList = competitors.map((c) => [
    c.scores.hormozi_axes?.dream ?? c.scores.hormozi ?? 0,
    c.scores.hormozi_axes?.belief ?? 0,
    c.scores.hormozi_axes?.speed ?? 0,
    c.scores.hormozi_axes?.ease ?? 0,
  ]);

  const medianAxes = axes.map((_, i) =>
    median(compAxesList.map((row) => row[i]).filter((n) => n > 0)),
  );
  const topAxes = axes.map((_, i) => top(compAxesList.map((row) => row[i])));

  let commentary = "";
  if (self) {
    const beliefIdx = 1;
    if (youAxes[beliefIdx] < medianAxes[beliefIdx] - 10) {
      commentary =
        `Вы провисаете в Belief (${Math.round(youAxes[beliefIdx])} vs медиана ${Math.round(medianAxes[beliefIdx])}). Усильте proof и снимите скепсис.`;
    } else if (self.scores.hormozi != null) {
      const med = median(competitors.map((c) => c.scores.hormozi ?? 0).filter((n) => n > 0));
      if (self.scores.hormozi < med - 8) {
        commentary = `Общий Hormozi ниже медианы ниши (${self.scores.hormozi} vs ${Math.round(med)}).`;
      } else {
        commentary = "По Hormozi вы на уровне или выше медианы ниши — фокус на дифференциации, не на догонянии.";
      }
    }
  }

  const scorecard = {
    framework: "hormozi",
    axes,
    you: youAxes.map((n) => Math.round(n)),
    median: medianAxes.map((n) => Math.round(n)),
    top: topAxes.map((n) => Math.round(n)),
    commentary,
  };

  const first_screen_wall = {
    rows: cards.map((c) => ({
      competitor_id: c.id,
      label: c.label,
      headline: c.first_screen.headline,
      sub_headline: c.first_screen.sub_headline,
      primary_cta: c.first_screen.primary_cta,
      trust_count: c.proof_inventory.length,
      awareness_target: c.awareness,
      is_self: c.is_self,
    })),
  };

  const trustKeys = ["reciprocity", "commitment", "social_proof", "authority", "liking", "scarcity"];
  const unused_triggers: string[] = [];
  for (const key of trustKeys) {
    const anyStrong = competitors.some((c) => {
      const v = (c.trust[key] ?? "none").toLowerCase();
      return v === "strong" || v === "сильно";
    });
    if (!anyStrong) unused_triggers.push(TRUST_LABELS[key] ?? key);
  }

  const headlines = competitors.map((c) => c.first_screen.headline?.toLowerCase()).filter(Boolean) as string[];
  const overused_patterns: string[] = [];
  const verbCounts = new Map<string, number>();
  for (const c of competitors) {
    const v = c.cta.verb?.toLowerCase();
    if (v) verbCounts.set(v, (verbCounts.get(v) ?? 0) + 1);
  }
  const threshold = Math.ceil(competitors.length * 0.7);
  for (const [verb, count] of verbCounts) {
    if (count >= threshold && threshold >= 2) {
      overused_patterns.push(`CTA «${verb}» у ${count}/${competitors.length} конкурентов`);
    }
  }

  const hormoziScores = competitors.map((c) => c.scores.hormozi).filter((n): n is number => n != null);
  const awarenessCounts = new Map<AwarenessLevel, number>();
  for (const c of cards) {
    awarenessCounts.set(c.awareness, (awarenessCounts.get(c.awareness) ?? 0) + 1);
  }
  let dominant_awareness: AwarenessLevel | null = null;
  let maxCount = 0;
  for (const [level, count] of awarenessCounts) {
    if (count > maxCount) {
      maxCount = count;
      dominant_awareness = level;
    }
  }

  const topVerbEntry = [...verbCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const niche_pulse = {
    avg_hormozi: hormoziScores.length
      ? Math.round(hormoziScores.reduce((a, b) => a + b, 0) / hormoziScores.length)
      : null,
    share_with_guarantee_pct: computeGuaranteeShare(cards),
    dominant_awareness,
    avg_cta_count: competitors.length
      ? Math.round(
          competitors.reduce((s, c) => s + (c.cta.count_on_page ?? 1), 0) / competitors.length * 10,
        ) / 10
      : null,
    top_cta_verb: topVerbEntry?.[0] ?? null,
    top_speed_promise: findTopSpeedPromise(competitors),
    unused_triggers,
    overused_patterns,
  };

  const trust_matrix = buildTrustMatrix(cards);
  const cta_inventory = buildCtaInventory(cards, verbCounts, threshold);
  const pricing_intelligence = buildPricingIntelligence(cards);
  const voice_overlap = buildVoiceOverlap(cards);
  const awareness_coverage = buildAwarenessCoverage(cards);
  const promise_gradient = buildPromiseGradient(cards);

  const comparison_table = buildComparisonTable(cards);

  return {
    comparison_table,
    positioning_map,
    scorecard,
    first_screen_wall,
    niche_pulse,
    trust_matrix,
    cta_inventory,
    pricing_intelligence,
    voice_overlap,
    awareness_coverage,
    promise_gradient,
  };
}

const INTEL_ROW_COUNT = 11;
const SUMMARY_ROW_COUNT = 4;
const NICHE_TABLE_MAX_SITES = 30;

const INTEL_ROWS: Array<{
  id: keyof IntelRecord;
  label: string;
  short: string;
  group: string;
}> = [
  { id: "revenue", label: "Выручка (если есть)", short: "Выручка", group: "Конкурентная разведка" },
  { id: "main_product", label: "Основной продукт", short: "Продукт", group: "Конкурентная разведка" },
  { id: "additional_products", label: "Дополнительные продукты", short: "Линейка", group: "Конкурентная разведка" },
  { id: "extraordinary", label: "Показатель экстраординарности", short: "Экстраординарность", group: "Конкурентная разведка" },
  { id: "traffic_channels", label: "Каналы трафика", short: "Трафик", group: "Конкурентная разведка" },
  { id: "offers", label: "Офферы / акции", short: "Офферы", group: "Конкурентная разведка" },
  { id: "sales_funnel", label: "Воронка продаж", short: "Воронка", group: "Конкурентная разведка" },
  { id: "conversion_elements", label: "Элементы конверсии", short: "Конверсия", group: "Конкурентная разведка" },
  { id: "martech", label: "Технологии автоматизации маркетинга", short: "MarTech", group: "Конкурентная разведка" },
  { id: "marketing_team", label: "Маркетинговая команда и подрядчики", short: "Команда", group: "Конкурентная разведка" },
];

const SUMMARY_ROWS = [
  {
    id: "positioning",
    label: "Позиционирование и УТП",
    short: "Позиционирование",
    group: "Сравнение (кратко)",
    pick: (c: SiteCard) => [c.intel.extraordinary, c.intel.main_product].filter((x) => x && x !== "—").join(" "),
  },
  {
    id: "funnel_depth",
    label: "Маркетинговая воронка и глубина",
    short: "Воронка",
    group: "Сравнение (кратко)",
    pick: (c: SiteCard) => c.intel.sales_funnel,
  },
  {
    id: "channels",
    label: "Каналы продвижения",
    short: "Каналы",
    group: "Сравнение (кратко)",
    pick: (c: SiteCard) => [c.intel.traffic_channels, c.intel.offers].filter((x) => x && x !== "—").join(" · "),
  },
  {
    id: "automation",
    label: "Автоматизация и вовлечение",
    short: "Автоматизация",
    group: "Сравнение (кратко)",
    pick: (c: SiteCard) => [c.intel.martech, c.intel.conversion_elements].filter((x) => x && x !== "—").join(" · "),
  },
];

function textCell(display: string) {
  return { display, numeric: null as number | null, tone: undefined as undefined };
}

/** Таблица по шаблону PDF: 11 критериев разведки + 4 кратких сравнения. */
export function buildComparisonTable(cards: SiteCard[]): Record<string, unknown> {
  const ordered = [
    ...cards.filter((c) => c.is_self),
    ...cards.filter((c) => !c.is_self),
  ].slice(0, NICHE_TABLE_MAX_SITES);

  const columns = ordered.map((c) => ({
    id: c.id,
    label: c.label,
    is_self: c.is_self,
    url: c.url ?? null,
  }));

  const intelRowDefs = [
    {
      id: "site_url",
      label: "Сайт",
      short_label: "Сайт",
      group: "Конкурентная разведка",
      format: "text" as const,
      cells: ordered.map((c) => textCell(c.url ?? c.label)),
    },
    ...INTEL_ROWS.map((r) => ({
      id: r.id,
      label: r.label,
      short_label: r.short,
      group: r.group,
      format: "text" as const,
      cells: ordered.map((c) => textCell(c.intel[r.id] ?? "—")),
    })),
    ...SUMMARY_ROWS.map((r) => ({
      id: r.id,
      label: r.label,
      short_label: r.short,
      group: r.group,
      format: "text" as const,
      cells: ordered.map((c) => textCell(r.pick(c) || "—")),
    })),
  ];

  return {
    columns: columns.map(({ id, label, is_self, url }) => ({ id, label, is_self, url })),
    rows: intelRowDefs.map((def) => ({
      id: def.id,
      label: def.label,
      short_label: def.short_label,
      group: def.group,
      format: def.format,
      niche_median: null,
      niche_top: null,
      cells: def.cells,
    })),
    indicator_count: INTEL_ROW_COUNT + SUMMARY_ROW_COUNT,
    intel_criteria_count: INTEL_ROW_COUNT,
    site_count: ordered.length,
    template: "competitive_intel_pdf",
  };
}

function trustCell(raw: string): "strong" | "weak" | "none" {
  const v = raw.toLowerCase();
  if (v === "strong" || v === "сильно") return "strong";
  if (v === "weak" || v === "слабо") return "weak";
  return "none";
}

function buildTrustMatrix(cards: SiteCard[]) {
  const triggers = ["reciprocity", "commitment", "social_proof", "authority", "liking", "scarcity"].map(
    (k) => TRUST_LABELS[k] ?? k,
  );
  const keys = ["reciprocity", "commitment", "social_proof", "authority", "liking", "scarcity"];
  return {
    triggers,
    rows: cards.map((c) => {
      const cells = keys.map((k) => trustCell(c.trust[k] ?? "none"));
      const strongCount = cells.filter((x) => x === "strong").length;
      return {
        competitor_id: c.id,
        label: c.label,
        is_self: c.is_self,
        cells,
        coverage_pct: Math.round((strongCount / keys.length) * 100),
      };
    }),
  };
}

function buildCtaInventory(
  cards: SiteCard[],
  verbCounts: Map<string, number>,
  threshold: number,
) {
  const self = cards.find((c) => c.is_self);
  const competitors = cards.filter((c) => !c.is_self);
  const cliche_verbs = [...verbCounts.entries()]
    .filter(([, count]) => count >= threshold && threshold >= 2)
    .map(([verb]) => verb);
  const compVerbs = new Set(competitors.map((c) => c.cta.verb?.toLowerCase()).filter(Boolean));
  const selfVerb = self?.cta.verb?.toLowerCase() ?? self?.first_screen.primary_cta?.split(/\s+/)[0]?.toLowerCase();
  const unique_to_you =
    selfVerb && !compVerbs.has(selfVerb) ? [selfVerb] : [];

  return {
    items: cards
      .filter((c) => c.first_screen.primary_cta)
      .map((c) => ({
        competitor_id: c.id,
        label: c.label,
        cta_text: c.first_screen.primary_cta ?? "",
        verb: c.cta.verb,
        scroll_position: "first_screen" as const,
        is_self: c.is_self,
      })),
    cliche_verbs,
    unique_to_you,
  };
}

function buildPricingIntelligence(cards: SiteCard[]) {
  const rows = cards.map((c) => ({
    competitor_id: c.id,
    label: c.label,
    extracted_price: c.pricing.extracted_price,
    pricing_model: normalizePricingModel(c.pricing.model),
    is_self: c.is_self,
  }));
  const compPrices = cards
    .filter((c) => !c.is_self && c.pricing.extracted_price)
    .map((c) => c.pricing.extracted_price as string);
  const selfPrice = cards.find((c) => c.is_self)?.pricing.extracted_price ?? null;
  return {
    rows,
    median_price_label: compPrices.length ? compPrices[Math.floor(compPrices.length / 2)] : null,
    ladder_position: inferLadderPosition(selfPrice, compPrices),
  };
}

function normalizePricingModel(raw: string | null):
  | "one_off"
  | "subscription"
  | "packages"
  | "freemium"
  | "on_request"
  | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (/subscr|подпис/i.test(s)) return "subscription";
  if (/package|пакет|тариф/i.test(s)) return "packages";
  if (/free|freemium|бесплат/i.test(s)) return "freemium";
  if (/request|запрос|индивид/i.test(s)) return "on_request";
  if (/one|разов|единораз/i.test(s)) return "one_off";
  return null;
}

function inferLadderPosition(
  selfPrice: string | null,
  compPrices: string[],
): "below_median" | "at_median" | "above_median" | "unknown" {
  if (!selfPrice || !compPrices.length) return "unknown";
  const selfNum = extractFirstNumber(selfPrice);
  const compNums = compPrices.map(extractFirstNumber).filter((n): n is number => n != null);
  if (selfNum == null || !compNums.length) return "unknown";
  const med = median(compNums);
  if (selfNum < med * 0.9) return "below_median";
  if (selfNum > med * 1.1) return "above_median";
  return "at_median";
}

function extractFirstNumber(s: string): number | null {
  const m = s.replace(/\s/g, "").match(/(\d[\d\s.,]*)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function tokenizePhrases(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4);
}

function buildVoiceOverlap(cards: SiteCard[]) {
  const self = cards.find((c) => c.is_self);
  const competitors = cards.filter((c) => !c.is_self);
  const selfWords = new Set([
    ...tokenizePhrases(self?.first_screen.headline),
    ...tokenizePhrases(self?.positioning.promise),
  ]);
  const compWordCounts = new Map<string, number>();
  for (const c of competitors) {
    for (const w of [...tokenizePhrases(c.first_screen.headline), ...tokenizePhrases(c.positioning.promise)]) {
      compWordCounts.set(w, (compWordCounts.get(w) ?? 0) + 1);
    }
  }
  const threshold = Math.max(2, Math.ceil(competitors.length * 0.5));
  const shared: string[] = [];
  const stealable: string[] = [];
  const cliche: string[] = [];
  for (const [word, count] of compWordCounts) {
    if (count >= threshold) {
      cliche.push(word);
      if (selfWords.has(word)) shared.push(word);
    } else if (!selfWords.has(word)) {
      stealable.push(word);
    }
  }
  const unique_to_you = [...selfWords].filter((w) => !compWordCounts.has(w)).slice(0, 8);
  return {
    shared: shared.slice(0, 8),
    stealable: stealable.slice(0, 8),
    unique_to_you,
    cliche: cliche.slice(0, 8),
  };
}

function buildAwarenessCoverage(cards: SiteCard[]) {
  return {
    segments: AWARENESS_ORDER.map((level) => {
      const ids = cards.filter((c) => c.awareness === level).map((c) => c.id);
      return {
        level,
        competitor_ids: ids,
        is_empty: ids.length === 0,
      };
    }),
  };
}

function buildPromiseGradient(cards: SiteCard[]) {
  const rows = cards.map((c) => ({
    competitor_id: c.id,
    label: c.label,
    intensity: Math.min(
      100,
      Math.max(0, c.positioning.promise_intensity ?? c.scores.hormozi ?? 50),
    ),
    promise: c.positioning.promise ?? c.first_screen.headline ?? "—",
    is_self: c.is_self,
  }));
  const intensities = rows.map((r) => r.intensity).sort((a, b) => a - b);
  const vacuum_zones: Array<{ from: number; to: number; reason: string }> = [];
  for (let i = 1; i < intensities.length; i++) {
    const gap = intensities[i] - intensities[i - 1];
    if (gap >= 25) {
      vacuum_zones.push({
        from: intensities[i - 1],
        to: intensities[i],
        reason: `Мало игроков с обещанием интенсивности ${intensities[i - 1]}–${intensities[i]}`,
      });
    }
  }
  return { rows, vacuum_zones: vacuum_zones.slice(0, 3) };
}

function computeGuaranteeShare(cards: SiteCard[]): number | null {
  if (!cards.length) return null;
  const withGuarantee = cards.filter((c) => {
    const blob = [
      c.positioning.promise,
      ...c.proof_inventory,
      c.first_screen.headline,
      c.first_screen.sub_headline,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return /гарант|guarant|возврат|refund|money.?back|risk.?free/i.test(blob);
  }).length;
  return Math.round((withGuarantee / cards.length) * 100);
}

function findTopSpeedPromise(competitors: SiteCard[]): string | null {
  let best: { score: number; text: string } | null = null;
  for (const c of competitors) {
    const speed = c.scores.hormozi_axes?.speed ?? null;
    const promise = c.positioning.promise ?? c.first_screen.headline;
    if (speed != null && promise) {
      if (!best || speed > best.score) best = { score: speed, text: promise };
    }
  }
  if (best) return best.text.slice(0, 120);
  for (const c of competitors) {
    const promise = c.positioning.promise ?? c.first_screen.headline;
    if (promise && /\d+\s*(дн|day|час|hour|мин)/i.test(promise)) return promise.slice(0, 120);
  }
  return null;
}

function findEmptyZones(cards: SiteCard[]): string[] {
  const occupied = new Set(cards.map((c) => `${c.awareness}:${c.sophistication}`));
  const zones: string[] = [];
  for (const aw of AWARENESS_ORDER) {
    for (let soph = 1; soph <= 5; soph++) {
      if (!occupied.has(`${aw}:${soph}`)) {
        zones.push(`${aw} × sophistication ${soph}`);
      }
    }
  }
  return zones.slice(0, 6);
}

export const STRATEGIES_SCHEMA = {
  type: "object",
  required: ["defensive", "blind_spot", "new_category"],
  properties: {
    defensive: {
      type: "object",
      required: ["title", "rationale", "what_to_change"],
      properties: {
        title: { type: "string" },
        rationale: { type: "string" },
        what_to_change: { type: "array", items: { type: "string" } },
      },
    },
    blind_spot: {
      type: "object",
      required: ["title", "rationale", "what_to_change"],
      properties: {
        title: { type: "string" },
        rationale: { type: "string" },
        what_to_change: { type: "array", items: { type: "string" } },
      },
    },
    new_category: {
      type: "object",
      required: ["title", "rationale", "what_to_change"],
      properties: {
        title: { type: "string" },
        rationale: { type: "string" },
        what_to_change: { type: "array", items: { type: "string" } },
      },
    },
  },
} as const;
