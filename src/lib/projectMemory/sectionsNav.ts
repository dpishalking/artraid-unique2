/** Метаданные полей секций памяти (для генерации форм). */
export type MemoryFieldUi = {
  path: string;
  label: string;
  variant: "line" | "area" | "lines";
};

export const MEMORY_SECTION_NAV: Array<{ id: string; title: string; hint?: string }> = [
  { id: "company", title: "Компания" },
  { id: "founder", title: "Владелец / автор / эксперт" },
  { id: "product", title: "Продукт" },
  { id: "audience", title: "Аудитория" },
  { id: "pains_desires", title: "Боли, желания и задачи" },
  { id: "offer_positioning", title: "Оффер и позиционирование" },
  { id: "websites", title: "Сайты и лендинги" },
  { id: "competitors", title: "Конкуренты" },
  { id: "proofs", title: "Доказательства и доверие" },
  { id: "objections", title: "Возражения" },
  { id: "pricing", title: "Цены и тарифы" },
  { id: "business_metrics", title: "Бизнес-показатели" },
  { id: "tone", title: "Тон коммуникации" },
  { id: "constraints", title: "Ограничения и важные детали" },
];

const company: MemoryFieldUi[] = [
  { path: "company_name", label: "Название компании", variant: "line" },
  { path: "company_description", label: "Чем занимается компания", variant: "area" },
  { path: "company_website", label: "Основной сайт", variant: "line" },
  { path: "company_location", label: "Город / рынок", variant: "line" },
  { path: "company_stage", label: "Стадия компании", variant: "line" },
  { path: "company_industry", label: "Ниша / отрасль", variant: "line" },
  { path: "company_size", label: "Размер компании", variant: "line" },
  { path: "company_mission", label: "Миссия", variant: "area" },
  { path: "company_advantages", label: "Сильные стороны компании (по строке)", variant: "lines" },
];

const founder: MemoryFieldUi[] = [
  { path: "founder_name", label: "Имя владельца / автора / эксперта", variant: "line" },
  { path: "founder_role", label: "Роль в проекте", variant: "line" },
  { path: "founder_bio", label: "Краткая биография", variant: "area" },
  { path: "founder_expertise", label: "Экспертность", variant: "area" },
  { path: "founder_story", label: "История, которую важно знать", variant: "area" },
  { path: "founder_credentials", label: "Регалии / сертификаты / опыт", variant: "area" },
  { path: "founder_media", label: "Публикации / выступления / медиа", variant: "area" },
  { path: "founder_social_links", label: "Социальные сети", variant: "area" },
];

const product: MemoryFieldUi[] = [
  { path: "product_name", label: "Название продукта", variant: "line" },
  { path: "product_description", label: "Что продаёте", variant: "area" },
  { path: "product_category", label: "Категория продукта", variant: "line" },
  { path: "product_format", label: "Формат продукта", variant: "line" },
  { path: "product_price_range", label: "Цена / диапазон цен", variant: "line" },
  { path: "product_delivery_method", label: "Как оказывается продукт", variant: "area" },
  { path: "product_core_result", label: "Главный результат для клиента", variant: "area" },
  { path: "product_unique_mechanism", label: "Уникальный механизм", variant: "area" },
  { path: "product_features", label: "Функции / состав продукта (по строке)", variant: "lines" },
  { path: "product_benefits", label: "Выгоды (по строке)", variant: "lines" },
  { path: "product_limitations", label: "Ограничения / кому не подходит", variant: "area" },
];

const audience: MemoryFieldUi[] = [
  { path: "target_audience", label: "Целевая аудитория", variant: "area" },
  { path: "audience_segments", label: "Сегменты аудитории (по строке)", variant: "lines" },
  { path: "best_customers", label: "Лучшие клиенты", variant: "area" },
  { path: "worst_customers", label: "Клиенты, которым продукт не подходит", variant: "area" },
  { path: "customer_situation", label: "В какой ситуации человек покупает", variant: "area" },
  { path: "customer_awareness_level", label: "Уровень осознанности клиента", variant: "area" },
  { path: "decision_maker", label: "Кто принимает решение", variant: "area" },
  { path: "buying_triggers", label: "Триггеры покупки", variant: "area" },
];

const pains: MemoryFieldUi[] = [
  { path: "main_pain", label: "Главная боль", variant: "area" },
  { path: "secondary_pains", label: "Вторичные боли (по строке)", variant: "lines" },
  { path: "hidden_pains", label: "Скрытые боли", variant: "area" },
  { path: "main_desire", label: "Главное желание", variant: "area" },
  { path: "desired_outcomes", label: "Желаемые результаты (по строке)", variant: "lines" },
  { path: "jobs_to_be_done", label: "Jobs To Be Done", variant: "area" },
  { path: "fears", label: "Страхи", variant: "area" },
  { path: "frustrations", label: "Раздражители", variant: "area" },
  { path: "alternatives", label: "Какие альтернативы уже пробовали", variant: "area" },
];

const offer: MemoryFieldUi[] = [
  { path: "current_offer", label: "Текущий оффер", variant: "area" },
  { path: "key_promise", label: "Ключевое обещание", variant: "area" },
  { path: "positioning", label: "Позиционирование", variant: "area" },
  { path: "unique_selling_proposition", label: "УТП", variant: "area" },
  { path: "differentiation", label: "Отстройка", variant: "area" },
  { path: "guarantee", label: "Гарантия", variant: "area" },
  { path: "urgency_reason", label: "Причина действовать сейчас", variant: "area" },
  { path: "call_to_action", label: "Призыв к действию", variant: "area" },
  { path: "offer_weaknesses", label: "Слабые стороны оффера", variant: "area" },
  { path: "offer_strengths", label: "Сильные стороны оффера", variant: "area" },
];

const websites: MemoryFieldUi[] = [
  { path: "main_website_url", label: "Основной сайт", variant: "line" },
  { path: "landing_urls", label: "Лендинги (по строке URL)", variant: "lines" },
  { path: "previous_landing_versions", label: "Прошлые версии лендингов", variant: "area" },
  { path: "current_landing_goal", label: "Цель текущего лендинга", variant: "area" },
  { path: "current_landing_problem", label: "Главная проблема текущего лендинга", variant: "area" },
  { path: "analytics_links", label: "Ссылки на аналитику", variant: "area" },
  { path: "important_pages", label: "Важные страницы", variant: "area" },
];

const proofs: MemoryFieldUi[] = [
  { path: "testimonials", label: "Отзывы", variant: "area" },
  { path: "cases", label: "Кейсы", variant: "area" },
  { path: "numbers", label: "Цифры", variant: "area" },
  { path: "certificates", label: "Сертификаты", variant: "area" },
  { path: "media_mentions", label: "Упоминания в медиа", variant: "area" },
  { path: "client_logos", label: "Логотипы клиентов (по строке)", variant: "lines" },
  { path: "before_after", label: "До / после", variant: "area" },
  { path: "expert_proofs", label: "Экспертные доказательства", variant: "area" },
  { path: "social_proof", label: "Социальное доказательство", variant: "area" },
  { path: "trust_assets", label: "Материалы доверия", variant: "area" },
];

const pricing: MemoryFieldUi[] = [
  { path: "pricing_model", label: "Модель цены", variant: "line" },
  { path: "price_points", label: "Цены", variant: "area" },
  { path: "packages", label: "Пакеты / тарифы", variant: "area" },
  { path: "payment_options", label: "Варианты оплаты", variant: "area" },
  { path: "discounts", label: "Скидки", variant: "area" },
  { path: "refund_policy", label: "Политика возврата", variant: "area" },
  { path: "comparison_with_alternatives", label: "Сравнение с альтернативами", variant: "area" },
];

const metrics: MemoryFieldUi[] = [
  { path: "monthly_revenue", label: "Выручка в месяц", variant: "line" },
  { path: "average_check", label: "Средний чек", variant: "line" },
  { path: "target_sales", label: "План продаж", variant: "line" },
  { path: "current_sales", label: "Текущие продажи", variant: "line" },
  { path: "conversion_rate", label: "Конверсия сайта", variant: "line" },
  { path: "lead_to_sale_conversion", label: "Конверсия лид → продажа", variant: "line" },
  { path: "traffic_sources", label: "Источники трафика", variant: "area" },
  { path: "ad_spend", label: "Расход на рекламу", variant: "line" },
  { path: "cpl", label: "CPL", variant: "line" },
  { path: "cpa", label: "CPA", variant: "line" },
  { path: "roas", label: "ROAS", variant: "line" },
  { path: "business_goal", label: "Бизнес-цель", variant: "area" },
];

const tone: MemoryFieldUi[] = [
  { path: "tone_of_voice", label: "Тон коммуникации", variant: "area" },
  { path: "forbidden_phrases", label: "Запрещённые формулировки", variant: "area" },
  { path: "preferred_phrases", label: "Предпочитаемые формулировки", variant: "area" },
  { path: "brand_style", label: "Стиль бренда", variant: "area" },
  { path: "examples_of_good_copy", label: "Примеры хороших текстов", variant: "area" },
  { path: "examples_of_bad_copy", label: "Примеры плохих текстов", variant: "area" },
];

const constraints: MemoryFieldUi[] = [
  { path: "legal_constraints", label: "Юридические ограничения", variant: "area" },
  { path: "medical_or_financial_disclaimers", label: "Дисклеймеры", variant: "area" },
  { path: "compliance_notes", label: "Комплаенс", variant: "area" },
  { path: "geography_limits", label: "География", variant: "area" },
  { path: "operational_limits", label: "Операционные ограничения", variant: "area" },
  { path: "things_not_to_say", label: "Что нельзя говорить", variant: "area" },
  { path: "important_notes", label: "Важные заметки", variant: "area" },
];

export const SECTION_FIELD_GROUPS: Record<string, MemoryFieldUi[]> = {
  company,
  founder,
  product,
  audience,
  pains_desires: pains,
  offer_positioning: offer,
  websites,
  proofs,
  pricing,
  business_metrics: metrics,
  tone,
  constraints,
};

export function getMemorySectionTitle(sectionId: string): string {
  return MEMORY_SECTION_NAV.find((item) => item.id === sectionId)?.title ?? sectionId;
}

export function getMemoryFieldLabel(sectionId: string, fieldPath: string): string {
  const fields = SECTION_FIELD_GROUPS[sectionId];
  return fields?.find((field) => field.path === fieldPath)?.label ?? fieldPath;
}
