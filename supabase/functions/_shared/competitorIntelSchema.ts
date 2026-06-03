/**
 * 11 критериев таблицы конкурентной разведки (по шаблону PDF).
 * Плюс 4 критерия краткого сравнения (вторая страница PDF).
 */

export const INTEL_CRITERIA = [
  {
    key: "revenue",
    label: "Выручка",
    short: "Выручка",
    description:
      "Оценка масштаба: публичные цифры, рейтинги EdTech, косвенные признаки. Если нет данных — честно «не раскрывается» + косвенные сигналы.",
  },
  {
    key: "main_product",
    label: "Основной продукт",
    short: "Продукт",
    description: "Флагман: название, формат, длительность, цена если видна, для кого.",
  },
  {
    key: "additional_products",
    label: "Дополнительные продукты",
    short: "Линейка",
    description: "Смежные курсы, бесплатные продукты, апселлы, корпоративное обучение.",
  },
  {
    key: "extraordinary",
    label: "Показатель экстраординарности",
    short: "Экстраординарность",
    description: "УТП, аккредитации, медийность, инновации, соцдоказательства, чем выделяются.",
  },
  {
    key: "traffic_channels",
    label: "Каналы трафика",
    short: "Трафик",
    description: "SEO, контекст, таргет, партнёрки/CPA, блог, email, бренд, офлайн — по фактам со страницы и UTM.",
  },
  {
    key: "offers",
    label: "Офферы / акции",
    short: "Офферы",
    description: "Скидки, рассрочка, гарантии, бесплатные продукты, промокоды, дедлайны.",
  },
  {
    key: "sales_funnel",
    label: "Воронка продаж",
    short: "Воронка",
    description: "Путь лида: лид-магнит → заявка → менеджер/авто → оплата; глубина дожима.",
  },
  {
    key: "conversion_elements",
    label: "Элементы конверсии",
    short: "Конверсия",
    description: "Таймеры, scarcity, CTA, отзывы, кейсы, квизы, гарантии, формы, чат.",
  },
  {
    key: "martech",
    label: "Автоматизация маркетинга",
    short: "MarTech",
    description: "CRM, аналитика, email/CDP, коллтрекинг, чат-боты, A/B — только если есть признаки на сайте.",
  },
  {
    key: "marketing_team",
    label: "Команда и подрядчики",
    short: "Команда",
    description: "In-house vs подрядчики, партнёрские сети, эксперты-спикеры, франшиза — по косвенным признакам.",
  },
] as const;

export const SUMMARY_CRITERIA = [
  { key: "positioning", label: "Позиционирование и УТП", maps: ["extraordinary", "main_product"] },
  { key: "funnel_depth", label: "Воронка и глубина", maps: ["sales_funnel"] },
  { key: "channels", label: "Каналы продвижения", maps: ["traffic_channels", "offers"] },
  { key: "automation", label: "Автоматизация и вовлечение", maps: ["martech", "conversion_elements"] },
] as const;

export type IntelRecord = Record<(typeof INTEL_CRITERIA)[number]["key"], string>;

/** JSON-schema properties для Gemini (все поля — строки, 2–4 предложения). */
export function intelSchemaProperties(): Record<string, { type: string; description: string }> {
  const out: Record<string, { type: string; description: string }> = {};
  for (const c of INTEL_CRITERIA) {
    out[c.key] = {
      type: "string",
      description: `${c.label}. ${c.description} 2–4 предложения, по-русски.`,
    };
  }
  return out;
}

export const INTEL_SCHEMA_REQUIRED = INTEL_CRITERIA.map((c) => c.key);

export const COMPETITOR_INTEL_SYSTEM_APPEND = `
Дополнительно заполни 11 полей конкурентной разведки (как в таблице стратегического разбора):
- revenue, main_product, additional_products, extraordinary, traffic_channels, offers, sales_funnel, conversion_elements, martech, marketing_team.
Пиши конкретно по фактам со страницы; не выдумывай цифры выручки без оснований.
Если данных нет — явно укажи «не раскрывается на сайте» и один косвенный сигнал.`;
