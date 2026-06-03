import type {
  AudienceSection,
  BusinessMetricsSection,
  CompanySection,
  ConstraintsSection,
  FounderSection,
  MemoryCompletionLevelSlug,
  MemoryCompetitor,
  ObjectionEntry,
  OfferPositioningSection,
  PainsDesiresSection,
  PricingSection,
  ProductSection,
  ProjectMemorySections,
  ProofsSection,
  ToneSection,
  WebsitesSection,
} from "./types";
import { BADGE_IDS } from "./types";

/** Вес секций (сумма = 100). */
export const SECTION_WEIGHT_PERCENT: Partial<Record<keyof ProjectMemorySections, number>> & {
  competitors: number;
  objections: number;
} = {
  company: 7,
  founder: 7,
  product: 12,
  audience: 12,
  pains_desires: 12,
  offer_positioning: 12,
  websites: 8,
  competitors: 8,
  proofs: 8,
  objections: 6,
  pricing: 4,
  business_metrics: 2,
  tone: 1,
  constraints: 1,
};

function strFilled(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function scr(v: unknown): number {
  return strFilled(v) ? 1 : 0;
}

/** Массив строк: по правилам ТЗ для «общих» полей. */
function genericArrayProgress(arr: unknown): number {
  if (!Array.isArray(arr)) return 0;
  const n = arr.map((x) => String(x).trim()).filter(Boolean).length;
  if (n === 0) return 0;
  if (n === 1) return 0.4;
  if (n <= 3) return 0.75;
  return 1;
}

function competitorProgress(list: MemoryCompetitor[]): number {
  const n = list.filter((c) => strFilled(c.name) || strFilled(c.url)).length;
  if (n === 0) return 0;
  if (n === 1) return 0.4;
  if (n === 2) return 0.75;
  return 1;
}

function objectionsProgress(arr: ObjectionEntry[]): number {
  const n = arr.filter((o) => strFilled(o.objection)).length;
  if (n === 0) return 0;
  if (n <= 2) return 0.4;
  if (n <= 5) return 0.75;
  return 1;
}

/** Доказательства: смесь строк и массивов строк. */
export function proofsProgress(p: ProofsSection): number {
  const chunks: number[] = [
    scr(p.testimonials),
    scr(p.cases),
    scr(p.numbers),
    scr(p.certificates),
    scr(p.media_mentions),
    genericArrayProgress(p.client_logos),
    scr(p.before_after),
    scr(p.expert_proofs),
    scr(p.social_proof),
    scr(p.trust_assets),
  ];
  return chunks.reduce((a, b) => a + b, 0) / chunks.length;
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((s, x) => s + x, 0) / nums.length : 0;
}

function scoreCompany(c: CompanySection): number {
  return avg([
    scr(c.company_name),
    scr(c.company_description),
    scr(c.company_website),
    scr(c.company_location),
    scr(c.company_stage),
    scr(c.company_industry),
    scr(c.company_size),
    scr(c.company_mission),
    genericArrayProgress(c.company_advantages),
  ]);
}

function scoreFounder(f: FounderSection): number {
  return avg([
    scr(f.founder_name),
    scr(f.founder_role),
    scr(f.founder_bio),
    scr(f.founder_expertise),
    scr(f.founder_story),
    scr(f.founder_credentials),
    scr(f.founder_media),
    scr(f.founder_social_links),
  ]);
}

function scoreProduct(p: ProductSection): number {
  return avg([
    scr(p.product_name),
    scr(p.product_description),
    scr(p.product_category),
    scr(p.product_format),
    scr(p.product_price_range),
    scr(p.product_delivery_method),
    scr(p.product_core_result),
    scr(p.product_unique_mechanism),
    genericArrayProgress(p.product_features),
    genericArrayProgress(p.product_benefits),
    scr(p.product_limitations),
  ]);
}

function scoreAudience(a: AudienceSection): number {
  return avg([
    scr(a.target_audience),
    genericArrayProgress(a.audience_segments),
    scr(a.best_customers),
    scr(a.worst_customers),
    scr(a.customer_situation),
    scr(a.customer_awareness_level),
    scr(a.decision_maker),
    scr(a.buying_triggers),
  ]);
}

function scorePains(pd: PainsDesiresSection): number {
  return avg([
    scr(pd.main_pain),
    genericArrayProgress(pd.secondary_pains),
    scr(pd.hidden_pains),
    scr(pd.main_desire),
    genericArrayProgress(pd.desired_outcomes),
    scr(pd.jobs_to_be_done),
    scr(pd.fears),
    scr(pd.frustrations),
    scr(pd.alternatives),
  ]);
}

function scoreOffer(o: OfferPositioningSection): number {
  return avg([
    scr(o.current_offer),
    scr(o.key_promise),
    scr(o.positioning),
    scr(o.unique_selling_proposition),
    scr(o.differentiation),
    scr(o.guarantee),
    scr(o.urgency_reason),
    scr(o.call_to_action),
    scr(o.offer_weaknesses),
    scr(o.offer_strengths),
  ]);
}

function scoreWebsites(w: WebsitesSection): number {
  return avg([
    scr(w.main_website_url),
    genericArrayProgress(w.landing_urls),
    scr(w.previous_landing_versions),
    scr(w.current_landing_goal),
    scr(w.current_landing_problem),
    scr(w.analytics_links),
    scr(w.important_pages),
  ]);
}

function scorePricing(pr: PricingSection): number {
  return avg([
    scr(pr.pricing_model),
    scr(pr.price_points),
    scr(pr.packages),
    scr(pr.payment_options),
    scr(pr.discounts),
    scr(pr.refund_policy),
    scr(pr.comparison_with_alternatives),
  ]);
}

function scoreMetrics(b: BusinessMetricsSection): number {
  return avg([
    scr(b.monthly_revenue),
    scr(b.average_check),
    scr(b.target_sales),
    scr(b.current_sales),
    scr(b.conversion_rate),
    scr(b.lead_to_sale_conversion),
    scr(b.traffic_sources),
    scr(b.ad_spend),
    scr(b.cpl),
    scr(b.cpa),
    scr(b.roas),
    scr(b.business_goal),
  ]);
}

function scoreTone(t: ToneSection): number {
  return avg([
    scr(t.tone_of_voice),
    scr(t.forbidden_phrases),
    scr(t.preferred_phrases),
    scr(t.brand_style),
    scr(t.examples_of_good_copy),
    scr(t.examples_of_bad_copy),
  ]);
}

function scoreConstraints(c: ConstraintsSection): number {
  return avg([
    scr(c.legal_constraints),
    scr(c.medical_or_financial_disclaimers),
    scr(c.compliance_notes),
    scr(c.geography_limits),
    scr(c.operational_limits),
    scr(c.things_not_to_say),
    scr(c.important_notes),
  ]);
}

export function sectionProgress(section: keyof ProjectMemorySections, snap: ProjectMemorySections): number {
  switch (section) {
    case "company":
      return scoreCompany(snap.company);
    case "founder":
      return scoreFounder(snap.founder);
    case "product":
      return scoreProduct(snap.product);
    case "audience":
      return scoreAudience(snap.audience);
    case "pains_desires":
      return scorePains(snap.pains_desires);
    case "offer_positioning":
      return scoreOffer(snap.offer_positioning);
    case "websites":
      return scoreWebsites(snap.websites);
    case "proofs":
      return proofsProgress(snap.proofs);
    case "pricing":
      return scorePricing(snap.pricing);
    case "business_metrics":
      return scoreMetrics(snap.business_metrics);
    case "tone":
      return scoreTone(snap.tone);
    case "constraints":
      return scoreConstraints(snap.constraints);
    case "competitors":
      return competitorProgress(snap.competitors ?? []);
    case "objections":
      return objectionsProgress(snap.objections ?? []);
    default:
      return 0;
  }
}

export function calculateProjectMemoryCompletionPct(snap: ProjectMemorySections): number {
  let total = 0;
  for (const key of Object.keys(SECTION_WEIGHT_PERCENT) as Array<keyof typeof SECTION_WEIGHT_PERCENT>) {
    const w = SECTION_WEIGHT_PERCENT[key];
    if (typeof w !== "number") continue;
    const p = Math.min(1, Math.max(0, sectionProgress(key as keyof ProjectMemorySections, snap)));
    total += w * p;
  }
  return Math.round(Math.min(100, Math.max(0, total)));
}

/** Имя из ТЗ (`calculateProjectMemoryCompletion`) — тот же расчёт, что и `*_Pct`. */
export function calculateProjectMemoryCompletion(snap: ProjectMemorySections): number {
  return calculateProjectMemoryCompletionPct(snap);
}

export function levelSlugFromCompletion(percent: number): MemoryCompletionLevelSlug {
  if (percent <= 20) return "empty";
  if (percent <= 40) return "basic";
  if (percent <= 60) return "understood";
  if (percent <= 80) return "strong_base";
  return "deep";
}

export const LEVEL_HINT_RU: Record<MemoryCompletionLevelSlug, string> = {
  empty:
    "Сервис пока знает о проекте слишком мало. Добавьте базовые данные, чтобы анализы стали точнее.",
  basic:
    "Базовый контекст есть. Можно запускать первые анализы, но точность будет выше после заполнения аудитории, оффера и конкурентов.",
  understood:
    "Проект уже понятен системе. Следующий шаг — добавить доказательства, возражения и конкурентов.",
  strong_base:
    "Хорошая база. AI уже может создавать более точные офферы, гипотезы и прототипы.",
  deep:
    "Глубокая память проекта. Сервис может давать максимально контекстные рекомендации и генерации.",
};

export const LEVEL_TITLE_RU: Record<MemoryCompletionLevelSlug, string> = {
  empty: "Пустой проект",
  basic: "Базовый контекст",
  understood: "Проект понятен",
  strong_base: "Сильная база для AI",
  deep: "Глубокая память проекта",
};

/** Бейджи монотонны: сохраняем уже выданные. */
export function mergeBadges(
  prev: string[],
  unlocked: Iterable<string>,
): { badges: string[]; newlyUnlocked: string[] } {
  const prevSet = new Set(prev ?? []);
  const newly: string[] = [];
  for (const id of unlocked) {
    if (!prevSet.has(id)) {
      prevSet.add(id);
      newly.push(id);
    }
  }
  return { badges: [...prevSet].sort(), newlyUnlocked: newly };
}

function sectionRatio(key: keyof ProjectMemorySections, snap: ProjectMemorySections): number {
  return Math.min(1, Math.max(0, sectionProgress(key, snap)));
}

export function evaluateAutoBadges(percent: number, snap: ProjectMemorySections): string[] {
  const out: string[] = [];
  out.push(BADGE_IDS.PROJECT_START);
  const companyOk = sectionRatio("company", snap) >= 0.55;
  const productOk = sectionRatio("product", snap) >= 0.55;
  const audienceOk = sectionRatio("audience", snap) >= 0.55;
  if (companyOk && productOk && audienceOk) out.push(BADGE_IDS.BASE_COLLECTED);

  const o = snap.offer_positioning;
  if (strFilled(o.current_offer) && strFilled(o.key_promise)) out.push(BADGE_IDS.OFFER_CLEAR);

  if ((snap.competitors ?? []).filter((c) => strFilled(c.name) || strFilled(c.url)).length >= 2) {
    out.push(BADGE_IDS.MARKET_ADDED);
  }

  if (
    proofsProgress(snap.proofs) >= 0.45 ||
    genericArrayProgress(snap.proofs.client_logos) >= 0.4 ||
    strFilled(snap.proofs.testimonials) ||
    strFilled(snap.proofs.cases)
  ) {
    out.push(BADGE_IDS.TRUST_COLLECTED);
  }

  const objN = (snap.objections ?? []).filter((x) => strFilled(x.objection)).length;
  if (objN >= 3) out.push(BADGE_IDS.OBJECTIONS_ACCOUNTED);

  if (percent >= 70) out.push(BADGE_IDS.PROTOTYPE_READY);
  if (percent >= 90) out.push(BADGE_IDS.DEEP_MEMORY);

  return out;
}

export const BADGE_LABEL_RU: Record<string, string> = {
  [BADGE_IDS.PROJECT_START]: "Старт проекта",
  [BADGE_IDS.BASE_COLLECTED]: "База собрана",
  [BADGE_IDS.OFFER_CLEAR]: "Оффер понятен",
  [BADGE_IDS.MARKET_ADDED]: "Рынок добавлен",
  [BADGE_IDS.TRUST_COLLECTED]: "Доверие собрано",
  [BADGE_IDS.OBJECTIONS_ACCOUNTED]: "Возражения учтены",
  [BADGE_IDS.PROTOTYPE_READY]: "Проект готов к прототипу",
  [BADGE_IDS.DEEP_MEMORY]: "Глубокая память",
};

export const SECTION_MICRO_REWARD_RU: Partial<Record<keyof ProjectMemorySections, string>> = {
  company: "Отлично. Корпоративный контекст поможет AI точнее упаковать проект.",
  founder: "Супер — личность автора добавлена. Усилится доверие и голос текста.",
  product: "Продукт описан подробнее. Генерация офферов и блоков будет конкретнее.",
  audience: "Отлично. Теперь AI сможет точнее учитывать аудиторию при создании оффера.",
  pains_desires: "Боли и желания зафиксированы — упаковка и первая секция станут сильнее.",
  offer_positioning: "Оффер и позиционирование понятнее — анализы и лендинг будут ближе к рынку.",
  websites: "Сайты и цели сохранены. Аудиты будут связаны с вашей реальной задачей.",
  competitors:
    "Конкуренты добавлены. Теперь анализ отстройки и конкурентный контекст станут сильнее.",
  proofs: "Доказательства сохранены. Теперь лендинг сможет звучать убедительнее.",
  objections: "Возражения зафиксированы — тексты смогут заранее их снимать.",
  pricing: "Цены учтены. AI точнее подберёт рамку обещания и УТП под монетизацию.",
  business_metrics:
    "Показатели добавлены. Рекомендации смогут опираться на вашу экономику воронки.",
  tone: "Тон сохранён. Копирайт будет более единообразным.",
  constraints: "Ограничения учтены. Меньше риска «лишних» формулировок в текстах AI.",
};

type NextAdvice = {
  priority: number;
  messageRu: string;
  relatesTo: keyof ProjectMemorySections;
};

const NEXT_ADVICES: NextAdvice[] = [
  {
    priority: 1,
    relatesTo: "product",
    messageRu: "Добавьте описание продукта — это основа для оффера, аудита и прототипа.",
  },
  {
    priority: 2,
    relatesTo: "audience",
    messageRu: "Опишите целевую аудиторию — так AI попадёт в язык и мотивацию клиента.",
  },
  {
    priority: 3,
    relatesTo: "offer_positioning",
    messageRu: "Добавьте текущий оффер — это улучшит анализ сайта и генерацию первого экрана.",
  },
  {
    priority: 4,
    relatesTo: "pains_desires",
    messageRu: "Зафиксируйте главную боль клиента — структура лендинга станет более релевантной.",
  },
  {
    priority: 5,
    relatesTo: "pains_desires",
    messageRu:
      "Опишите главное желание / результат — офферы и блок «желаемое будущее» станут точнее.",
  },
  {
    priority: 6,
    relatesTo: "websites",
    messageRu:
      "Укажите основной сайт или лендинг — аудит и рекомендации будут привязаны к источнику.",
  },
  {
    priority: 7,
    relatesTo: "competitors",
    messageRu: "Добавьте 2–3 конкурентов — это позволит находить идеи для отстройки.",
  },
  {
    priority: 8,
    relatesTo: "proofs",
    messageRu: "Добавьте доказательства — это поможет AI создавать более убедительные лендинги.",
  },
  {
    priority: 9,
    relatesTo: "objections",
    messageRu:
      "Пропишите возражения — тексты смогут заранее снимать сомнения (дорого / не верю и т.д.).",
  },
  {
    priority: 10,
    relatesTo: "pricing",
    messageRu: "Дополните цены и условия — УТП и блоки оффера будут экономически связаны.",
  },
];

function adviseSatisfied(rel: keyof ProjectMemorySections, snap: ProjectMemorySections): boolean {
  return sectionRatio(rel, snap) >= 0.72;
}

export function getProjectMemoryNextHints(snapshot: ProjectMemorySections, limit = 5): string[] {
  const msgs: string[] = [];
  for (const row of [...NEXT_ADVICES].sort((a, b) => a.priority - b.priority)) {
    if (adviseSatisfied(row.relatesTo, snapshot)) continue;
    if (!msgs.includes(row.messageRu)) msgs.push(row.messageRu);
    if (msgs.length >= limit) break;
  }
  return msgs;
}

/** Имя из ТЗ — список 3–5 текстовых рекомендаций по следующим полям */
export function getProjectMemoryNextFields(snapshot: ProjectMemorySections, limit = 5): string[] {
  return getProjectMemoryNextHints(snapshot, limit);
}

export function sectionStatuses(snapshot: ProjectMemorySections): Partial<
  Record<keyof ProjectMemorySections, "empty" | "partial" | "full">
> {
  const out: Partial<
    Record<keyof ProjectMemorySections, "empty" | "partial" | "full">
  > = {};
  const keys = Object.keys(SECTION_WEIGHT_PERCENT) as Array<keyof ProjectMemorySections>;
  for (const k of keys) {
    const r = sectionRatio(k, snapshot);
    if (r <= 0.05) out[k] = "empty";
    else if (r < 0.85) out[k] = "partial";
    else out[k] = "full";
  }
  return out;
}

export function topStrongSections(snapshot: ProjectMemorySections, n = 3): Array<keyof ProjectMemorySections> {
  const keys = Object.keys(SECTION_WEIGHT_PERCENT) as Array<keyof ProjectMemorySections>;
  return keys
    .map((k) => ({ k, r: sectionRatio(k, snapshot) }))
    .filter(({ r }) => r >= 0.35)
    .sort((a, b) => b.r - a.r)
    .slice(0, n)
    .map((x) => x.k);
}

export function weakestSections(snapshot: ProjectMemorySections, n = 3): Array<keyof ProjectMemorySections> {
  const keys = Object.keys(SECTION_WEIGHT_PERCENT) as Array<keyof ProjectMemorySections>;
  return keys
    .map((k) => ({ k, r: sectionRatio(k, snapshot) }))
    .filter(({ r }) => r < 0.72)
    .sort((a, b) => a.r - b.r)
    .slice(0, n)
    .map((x) => x.k);
}
