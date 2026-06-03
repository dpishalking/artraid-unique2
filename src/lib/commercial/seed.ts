import type { CommercialMetricSeed } from "./types";

export const COMMERCIAL_METRIC_SEEDS: CommercialMetricSeed[] = [
  // Главные цели
  { slug: "north_star", name: "North Star Metric", category: "goals", unit: "шт", direction: "higher_is_better", is_primary: true },
  { slug: "goal_month", name: "Цель на месяц", category: "goals", unit: "шт", direction: "higher_is_better", is_primary: true },
  { slug: "goal_quarter", name: "Цель на квартал", category: "goals", unit: "шт", direction: "higher_is_better" },
  { slug: "goal_year", name: "Цель на год", category: "goals", unit: "шт", direction: "higher_is_better" },
  { slug: "min_acceptable", name: "Минимально допустимый результат", category: "goals", unit: "шт", direction: "higher_is_better" },
  { slug: "critical_zone", name: "Критическая зона", category: "goals", unit: "шт", direction: "lower_is_better" },

  // Деньги
  { slug: "revenue", name: "Выручка", category: "money", unit: "₽", direction: "higher_is_better", is_primary: true },
  { slug: "net_profit", name: "Чистая прибыль", category: "money", unit: "₽", direction: "higher_is_better" },
  { slug: "margin_percent", name: "Маржинальность", category: "money", unit: "%", direction: "higher_is_better" },
  { slug: "avg_check_money", name: "Средний чек", category: "money", unit: "₽", direction: "higher_is_better" },
  { slug: "gross_profit", name: "Валовая прибыль", category: "money", unit: "₽", direction: "higher_is_better" },
  { slug: "cogs", name: "Себестоимость", category: "money", unit: "₽", direction: "lower_is_better" },
  { slug: "ad_budget", name: "Рекламный бюджет", category: "money", unit: "₽", direction: "target_range" },
  { slug: "opex", name: "Операционные расходы", category: "money", unit: "₽", direction: "lower_is_better" },
  { slug: "max_cpl", name: "Допустимая стоимость заявки", category: "money", unit: "₽", direction: "lower_is_better" },
  { slug: "max_cac", name: "Допустимая стоимость клиента", category: "money", unit: "₽", direction: "lower_is_better" },

  // Воронка
  { slug: "impressions", name: "Показы", category: "funnel", unit: "шт", direction: "higher_is_better" },
  { slug: "clicks", name: "Клики", category: "funnel", unit: "шт", direction: "higher_is_better" },
  { slug: "ctr", name: "CTR", category: "funnel", unit: "%", direction: "higher_is_better" },
  { slug: "cpc", name: "CPC", category: "funnel", unit: "₽", direction: "lower_is_better" },
  { slug: "leads", name: "Заявки", category: "funnel", unit: "шт", direction: "higher_is_better" },
  { slug: "lead_cost", name: "Стоимость заявки", category: "funnel", unit: "₽", direction: "lower_is_better", is_primary: true },
  { slug: "site_conversion", name: "Конверсия сайта", category: "funnel", unit: "%", direction: "higher_is_better", is_primary: true },
  { slug: "qualified_leads", name: "Квалифицированные заявки", category: "funnel", unit: "шт", direction: "higher_is_better" },
  { slug: "calls", name: "Звонки", category: "funnel", unit: "шт", direction: "higher_is_better" },
  { slug: "meetings", name: "Встречи / консультации", category: "funnel", unit: "шт", direction: "higher_is_better" },
  { slug: "funnel_sales", name: "Продажи", category: "funnel", unit: "шт", direction: "higher_is_better" },
  { slug: "sale_conversion", name: "Конверсия в продажу", category: "funnel", unit: "%", direction: "higher_is_better" },
  { slug: "cost_per_sale", name: "Стоимость продажи", category: "funnel", unit: "₽", direction: "lower_is_better" },
  { slug: "roas", name: "ROAS", category: "funnel", unit: "x", direction: "higher_is_better" },
  { slug: "romi", name: "ROMI", category: "funnel", unit: "%", direction: "higher_is_better" },

  // Продажи
  { slug: "sales_count", name: "Количество продаж", category: "sales", unit: "шт", direction: "higher_is_better" },
  { slug: "avg_check_sales", name: "Средний чек", category: "sales", unit: "₽", direction: "higher_is_better" },
  { slug: "upsells", name: "Апсейлы", category: "sales", unit: "шт", direction: "higher_is_better" },
  { slug: "repeat_sales", name: "Повторные продажи", category: "sales", unit: "шт", direction: "higher_is_better" },
  { slug: "manager_conversion", name: "Конверсия менеджера", category: "sales", unit: "%", direction: "higher_is_better" },
  { slug: "lead_response_speed", name: "Скорость обработки лида", category: "sales", unit: "мин", direction: "lower_is_better" },
  { slug: "no_answer_rate", name: "Процент недозвонов", category: "sales", unit: "%", direction: "lower_is_better" },
  { slug: "rejection_rate", name: "Процент отказов", category: "sales", unit: "%", direction: "lower_is_better" },
  { slug: "rejection_reasons", name: "Причины отказов", category: "sales", unit: "описание", direction: "target_range" },
  { slug: "objections", name: "Основные возражения", category: "sales", unit: "описание", direction: "target_range" },
  { slug: "buyout_rate", name: "Выкуп", category: "sales", unit: "%", direction: "higher_is_better", is_primary: true },

  // Продуктовые
  { slug: "active_clients", name: "Активные клиенты", category: "product", unit: "шт", direction: "higher_is_better" },
  { slug: "retention", name: "Retention", category: "product", unit: "%", direction: "higher_is_better" },
  { slug: "churn_rate", name: "Churn rate", category: "product", unit: "%", direction: "lower_is_better" },
  { slug: "ltv_product", name: "LTV", category: "product", unit: "₽", direction: "higher_is_better" },
  { slug: "repeat_purchases", name: "Повторные покупки", category: "product", unit: "шт", direction: "higher_is_better" },
  { slug: "returns", name: "Возвраты", category: "product", unit: "%", direction: "lower_is_better" },
  { slug: "satisfaction", name: "Удовлетворённость", category: "product", unit: "баллы", direction: "higher_is_better" },
  { slug: "outcome_completion", name: "Доля клиентов, дошедших до результата", category: "product", unit: "%", direction: "higher_is_better" },

  // Юнит-экономика
  { slug: "cac", name: "CAC", category: "unit_economics", unit: "₽", direction: "lower_is_better" },
  { slug: "ltv_unit", name: "LTV", category: "unit_economics", unit: "₽", direction: "higher_is_better" },
  { slug: "ltv_cac_ratio", name: "LTV/CAC", category: "unit_economics", unit: "x", direction: "higher_is_better" },
  { slug: "payback_period", name: "Payback period", category: "unit_economics", unit: "мес", direction: "lower_is_better" },
  { slug: "contribution_margin", name: "Contribution margin", category: "unit_economics", unit: "₽", direction: "higher_is_better" },
  { slug: "profit_per_sale", name: "Прибыль с одной продажи", category: "unit_economics", unit: "₽", direction: "higher_is_better" },
  { slug: "profit_per_lead", name: "Прибыль с одного лида", category: "unit_economics", unit: "₽", direction: "higher_is_better" },
  { slug: "break_even", name: "Точка безубыточности", category: "unit_economics", unit: "₽", direction: "target_range" },
];
