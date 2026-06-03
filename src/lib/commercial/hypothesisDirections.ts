const DIRECTIONS_BY_SLUG: Record<string, string[]> = {
  site_conversion: [
    "первый экран",
    "оффер",
    "доказательства",
    "форма заявки",
    "CTA",
    "квиз",
    "кейсы",
    "блок доверия",
  ],
  lead_cost: [
    "сегмент аудитории",
    "креатив",
    "посадочная страница",
    "оффер",
    "лид-магнит",
    "рекламный канал",
  ],
  max_cpl: [
    "сегмент аудитории",
    "креатив",
    "посадочная страница",
    "оффер",
    "лид-магнит",
    "рекламный канал",
  ],
  avg_check_money: [
    "тарифы",
    "пакеты",
    "апсейлы",
    "премиальный продукт",
    "якорь цены",
    "бонусы",
  ],
  avg_check_sales: [
    "тарифы",
    "пакеты",
    "апсейлы",
    "премиальный продукт",
    "якорь цены",
    "бонусы",
  ],
  buyout_rate: [
    "скрипт подтверждения",
    "предоплата",
    "коммуникация до доставки",
    "объяснение ценности",
    "работа с отказами",
  ],
};

const DIRECTIONS_BY_CATEGORY: Record<string, string[]> = {
  funnel: ["посадочная страница", "оффер", "креатив", "форма заявки", "CTA"],
  sales: ["скрипт продаж", "обработка возражений", "скорость ответа", "квалификация"],
  money: ["тарифы", "маржа", "расходы", "unit-экономика"],
  product: ["онбординг", "удержание", "качество продукта", "поддержка"],
  goals: ["фокус команды", "приоритизация", "ресурсы"],
  unit_economics: ["CAC", "LTV", "конверсия", "средний чек"],
};

const GENERIC_DIRECTIONS = [
  "оффер",
  "посадочная страница",
  "креатив",
  "скрипт продаж",
  "сегмент аудитории",
  "продукт",
];

export function getHypothesisDirections(args: {
  slug: string | null;
  category: string;
  name: string;
}): string[] {
  if (args.slug && DIRECTIONS_BY_SLUG[args.slug]) {
    return DIRECTIONS_BY_SLUG[args.slug];
  }

  const nameLower = args.name.toLowerCase();
  if (nameLower.includes("конверси") && nameLower.includes("сайт")) {
    return DIRECTIONS_BY_SLUG.site_conversion;
  }
  if (nameLower.includes("стоимость заявки") || nameLower.includes("cpl")) {
    return DIRECTIONS_BY_SLUG.lead_cost;
  }
  if (nameLower.includes("средний чек")) {
    return DIRECTIONS_BY_SLUG.avg_check_money;
  }
  if (nameLower.includes("выкуп")) {
    return DIRECTIONS_BY_SLUG.buyout_rate;
  }

  return DIRECTIONS_BY_CATEGORY[args.category] ?? GENERIC_DIRECTIONS;
}
