import type { Project, ProjectContext } from "@/lib/projects/types";
import { getProjectById } from "@/lib/projects/projectApi";
import { getProjectMemoryRow } from "./api";
import { mergeStoredMemoryIntoSections } from "./mergeSections";
import type { ProjectMemorySections } from "./types";
import { calculateProjectMemoryCompletionPct, proofsProgress } from "./completion";

function ln(label: string, value: unknown, maxLen = 2000): string | null {
  const s =
    typeof value === "string"
      ? value.trim()
      : value == null
        ? ""
        : String(value).trim();
  if (!s) return null;
  const x = s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  return `${label}: ${x}`;
}

function arrLine(label: string, arr: unknown, maxItems = 20): string | null {
  if (!Array.isArray(arr) || !arr.length) return null;
  const items = arr
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, maxItems);
  return items.length ? `${label}: ${items.join("; ")}` : null;
}

/** Компактный текст секций памяти для промптов AI (локально; дубль в edge). */
export function formatProjectMemorySnapshotForAi(snap: ProjectMemorySections, percentHint?: number): string {
  const c = snap.company;
  const f = snap.founder;
  const p = snap.product;
  const a = snap.audience;
  const pd = snap.pains_desires;
  const o = snap.offer_positioning;
  const w = snap.websites;
  const pr = snap.proofs;
  const comp = snap.competitors ?? [];
  const objections = snap.objections ?? [];

  const compLines = comp
    .slice(0, 8)
    .map((k) =>
      [[k.name, k.url].filter(Boolean).join(" — "), k.positioning, k.notes]
        .filter(Boolean)
        .join(" · "),
    )
    .filter(Boolean);

  const objLines = objections.slice(0, 10).map((x) =>
    [x.objection, x.answer, x.proof].filter(Boolean).join(" → "),
  );

  const parts: string[] = [
    "### Память проекта (структурировано)",
    ...[
      ln("Компания", c.company_name),
      ln("Чем занимается", c.company_description),
      ln("Сайт компании", c.company_website),
      ln("Рынок / локация", c.company_location),
      ln("Стадия", c.company_stage),
      ln("Отрасль", c.company_industry),
      ln("Размер компании", c.company_size),
      ln("Миссия", c.company_mission),
      arrLine("Сильные стороны", c.company_advantages),
      ln("Автор / эксперт", f.founder_name),
      ln("Роль автора", f.founder_role),
      ln("Биография", f.founder_bio),
      ln("Экспертиза", f.founder_expertise),
      ln("История", f.founder_story),
      ln("Регалии", f.founder_credentials),
      ln("Медиа", f.founder_media),
      ln("Соцсети автора", f.founder_social_links),
      ln("Продукт", p.product_name),
      ln("Описание продукта", p.product_description),
      ln("Категория", p.product_category),
      ln("Формат", p.product_format),
      ln("Цена / диапазон", p.product_price_range),
      ln("Как оказывается", p.product_delivery_method),
      ln("Главный результат", p.product_core_result),
      ln("Уникальный механизм", p.product_unique_mechanism),
      arrLine("Функции", p.product_features),
      arrLine("Выгоды", p.product_benefits),
      ln("Ограничения продукта", p.product_limitations),
      ln("Целевая аудитория", a.target_audience),
      arrLine("Сегменты аудитории", a.audience_segments),
      ln("Лучшие клиенты", a.best_customers),
      ln("Клиенты «не наш» сегмент", a.worst_customers),
      ln("Ситуация покупки", a.customer_situation),
      ln("Осознанность клиента", a.customer_awareness_level),
      ln("ЛПР", a.decision_maker),
      ln("Триггеры покупки", a.buying_triggers),
      ln("Главная боль", pd.main_pain),
      arrLine("Дополнительные боли", pd.secondary_pains),
      ln("Скрытые боли", pd.hidden_pains),
      ln("Главное желание", pd.main_desire),
      arrLine("Желаемые результаты", pd.desired_outcomes),
      ln("JTBD", pd.jobs_to_be_done),
      ln("Страхи", pd.fears),
      ln("Раздражители", pd.frustrations),
      ln("Альтернативы, которые уже пробовали", pd.alternatives),
      ln("Текущий оффер", o.current_offer),
      ln("Ключевое обещание", o.key_promise),
      ln("Позиционирование", o.positioning),
      ln("УТП", o.unique_selling_proposition),
      ln("Отстройка", o.differentiation),
      ln("Гарантия", o.guarantee),
      ln("Причина срочности", o.urgency_reason),
      ln("Призыв к действию", o.call_to_action),
      ln("Слабые места оффера", o.offer_weaknesses),
      ln("Сильные места оффера", o.offer_strengths),
      ln("Основной сайт / лендинг", w.main_website_url),
      arrLine("Другие лендинги", w.landing_urls),
      ln("Прошлые версии", w.previous_landing_versions),
      ln("Цель текущего лендинга", w.current_landing_goal),
      ln("Главная проблема текущего лендинга", w.current_landing_problem),
      ln("Ссылки на аналитику", w.analytics_links),
      ln("Важные страницы", w.important_pages),
      ...(compLines.length ? [`Конкуренты (${compLines.length}): ${compLines.join(" | ")}`] : []),
      ln("Отзывы и доказательства (текст)", pr.testimonials),
      ln("Кейсы", pr.cases),
      ln("Цифры как доказательство", pr.numbers),
      ln("Сертификаты", pr.certificates),
      ln("Упоминания в медиа", pr.media_mentions),
      arrLine("Логотипы клиентов", pr.client_logos),
      ln("До / после", pr.before_after),
      ln("Экспертные доказательства", pr.expert_proofs),
      ln("Соцдоказательство", pr.social_proof),
      ln("Материалы доверия", pr.trust_assets),
      ...(objLines.length ? [`Возражения: ${objLines.join(" ;; ")}`] : []),
      ln("Модель цены", snap.pricing.pricing_model),
      ln("Цены", snap.pricing.price_points),
      ln("Тарифы / пакеты", snap.pricing.packages),
      ln("Способы оплаты", snap.pricing.payment_options),
      ln("Скидки", snap.pricing.discounts),
      ln("Политика возвратов", snap.pricing.refund_policy),
      ln("Сравнение с альтернативами по цене", snap.pricing.comparison_with_alternatives),
      ln("Выручка в месяц", snap.business_metrics.monthly_revenue),
      ln("Средний чек", snap.business_metrics.average_check),
      ln("План продаж", snap.business_metrics.target_sales),
      ln("Факт продаж", snap.business_metrics.current_sales),
      ln("Конверсия сайта", snap.business_metrics.conversion_rate),
      ln("Лид → продажа", snap.business_metrics.lead_to_sale_conversion),
      ln("Трафик", snap.business_metrics.traffic_sources),
      ln("Бюджет рекламы", snap.business_metrics.ad_spend),
      ln("CPL", snap.business_metrics.cpl),
      ln("CPA", snap.business_metrics.cpa),
      ln("ROAS", snap.business_metrics.roas),
      ln("Бизнес-цель", snap.business_metrics.business_goal),
      ln("Тон коммуникации", snap.tone.tone_of_voice),
      ln("Запрещённые формулировки", snap.tone.forbidden_phrases),
      ln("Предпочитаемые формулировки", snap.tone.preferred_phrases),
      ln("Стиль бренда", snap.tone.brand_style),
      ln("Примеры хороших текстов", snap.tone.examples_of_good_copy),
      ln("Примеры плохих текстов", snap.tone.examples_of_bad_copy),
      ln("Юридические ограничения", snap.constraints.legal_constraints),
      ln("Дисклеймеры", snap.constraints.medical_or_financial_disclaimers),
      ln("Комплаенс", snap.constraints.compliance_notes),
      ln("Географические ограничения", snap.constraints.geography_limits),
      ln("Операционные ограничения", snap.constraints.operational_limits),
      ln("Что нельзя говорить", snap.constraints.things_not_to_say),
      ln("Дополнительные важные детали", snap.constraints.important_notes),
    ].filter((x): x is string => Boolean(x)),
  ];

  const pct = typeof percentHint === "number" ? percentHint : calculateProjectMemoryCompletionPct(snap);
  parts.push("", `Заполненность памяти проекта по структуре: около ${pct}% (ориентир).`);

  const weak: string[] = [];
  const proofPct = proofsProgress(snap.proofs);
  const compCount = (snap.competitors ?? []).filter(
    (k) => (k.url ?? "").trim() || (k.name ?? "").trim(),
  ).length;
  const objCount = (snap.objections ?? []).filter((x) => (x.objection ?? "").trim()).length;

  if (proofPct < 0.35) weak.push("доказательств и доверия");
  if (compCount < 2) weak.push("конкурентной отстройки (мало записей конкурентов)");
  if (objCount < 2) weak.push("работы с возражениями");

  if (pct < 40 || weak.length) {
    parts.push(
      "",
      "Учитывай: часть блоков памяти может быть заполнена слабо. Если по проекту мало данных (особенно " +
        (weak.length ? weak.join(", ") : "общий контекст") +
        "), честно снижай уверенность в рекомендациях по доверию и отстройке и явно помечай, чего не хватает.",
    );
  }

  return parts.join("\n");
}

/** Совмещает «старый» projects + project_contexts + новую память в один промпт-блок для AI. */
export function buildProjectMemoryContext(
  snapshot: ProjectMemorySections,
  project?: Pick<
    Project,
    | "name"
    | "product_name"
    | "product_description"
    | "target_audience"
    | "current_website_url"
    | "current_offer"
  > | null,
  context?: Pick<
    ProjectContext,
    | "key_promise"
    | "main_pain"
    | "main_desire"
    | "positioning"
    | "unique_mechanism"
    | "key_proofs"
    | "objections"
  > | null,
): string {
  const lines: string[] = [
    "{{project_memory_context}}",
    "## КОНТЕКСТ ПРОЕКТА (источники: память проекта + карточка проекта + расширенный контекст)",
  ];

  if (project?.name) lines.push(...(ln("Проект", project.name) ? [ln("Проект", project.name)!] : []));
  lines.push(
    ...[
      ln("Продукт (карточка проекта)", project?.product_description ?? project?.product_name ?? ""),
      ln("Целевая аудитория (карточка)", project?.target_audience ?? ""),
      ln("Текущий оффер (карточка)", project?.current_offer ?? ""),
      ln("Сайт из карточки проекта", project?.current_website_url ?? ""),
      ln("Ключевое обещание", context?.key_promise ?? ""),
      ln("Главная боль", context?.main_pain ?? ""),
      ln("Желание клиента", context?.main_desire ?? ""),
      ln("Позиционирование", context?.positioning ?? ""),
      ln("Уникальный механизм", context?.unique_mechanism ?? ""),
      arrLine("Доказательства (контекст)", context?.key_proofs),
      Array.isArray(context?.objections) && context.objections.length
        ? `Возражения (контекст): ${context.objections.map((x) => String(x)).filter(Boolean).join("; ")}`
        : null,
    ].filter((x): x is string => Boolean(x)),
  );

  lines.push("", formatProjectMemorySnapshotForAi(snapshot));
  return lines.join("\n");
}

/** Карточка + контекст + память (для клиентских вызовов, если нужно собрать тот же блок, что в edge `loadProjectContextBlock`). */
export async function buildProjectMemoryContextFromRemoteProject(projectId: string): Promise<string> {
  const [bundle, memoryRow] = await Promise.all([getProjectById(projectId), getProjectMemoryRow(projectId)]);
  if (!bundle) return "{{project_memory_context}}\n(проект не найден)";
  const snap = mergeStoredMemoryIntoSections(memoryRow as unknown as Record<string, unknown>);
  return buildProjectMemoryContext(snap, bundle.project, bundle.context);
}
