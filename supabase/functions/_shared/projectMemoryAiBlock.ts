/** Дублирует клиентский `formatProjectMemorySnapshotForAi` для Deno (без импортов из src). */

export function proofsProgressApprox(p: Record<string, unknown>): number {
  const scr = (v: unknown) => (typeof v === "string" && v.trim() ? 1 : 0);
  const genArr = (arr: unknown) => {
    if (!Array.isArray(arr)) return 0;
    const n = arr.map((x) => String(x).trim()).filter(Boolean).length;
    if (n === 0) return 0;
    if (n === 1) return 0.4;
    if (n <= 3) return 0.75;
    return 1;
  };
  const chunks = [
    scr(p.testimonials),
    scr(p.cases),
    scr(p.numbers),
    scr(p.certificates),
    scr(p.media_mentions),
    genArr(p.client_logos),
    scr(p.before_after),
    scr(p.expert_proofs),
    scr(p.social_proof),
    scr(p.trust_assets),
  ];
  return chunks.reduce((a, b) => a + b, 0) / chunks.length;
}

function ln(label: string, value: unknown, maxLen = 2000): string | null {
  const s = value == null ? "" : String(value).trim();
  if (!s) return null;
  const x = s.length > maxLen ? `${s.slice(0, maxLen)}…` : s;
  return `${label}: ${x}`;
}

function arrLine(label: string, arr: unknown, maxItems = 20): string | null {
  if (!Array.isArray(arr) || !arr.length) return null;
  const items = arr.map((x) => String(x).trim()).filter(Boolean).slice(0, maxItems);
  return items.length ? `${label}: ${items.join("; ")}` : null;
}

export function calculateCompletionApproxFromMerged(
  merged: Record<string, unknown>,
): number {
  // Упрощённый процент только для текстовой оговорки в промпте; источник правды по % — строка БД клиента.
  const keys = [
    "company",
    "founder",
    "product",
    "audience",
    "pains_desires",
    "offer_positioning",
    "websites",
    "proofs",
    "pricing",
    "business_metrics",
    "tone",
    "constraints",
  ];
  const weights: Record<string, number> = {
    company: 7,
    founder: 7,
    product: 12,
    audience: 12,
    pains_desires: 12,
    offer_positioning: 12,
    websites: 8,
    proofs: 8,
    competitors: 8,
    objections: 6,
    pricing: 4,
    business_metrics: 2,
    tone: 1,
    constraints: 1,
  };
  let filled = 0;
  let wsum = 0;
  function objFill(o: Record<string, unknown>): number {
    const vals = Object.values(o ?? {});
    if (!vals.length) return 0;
    let sc = 0;
    let n = 0;
    for (const v of vals) {
      n++;
      if (Array.isArray(v)) sc += Math.min(1, v.filter((x) => String(x).trim()).length / 5);
      else if (typeof v === "string" && v.trim()) sc += 1;
    }
    return n ? Math.min(1, sc / n) : 0;
  }
  for (const k of keys) {
    const w = weights[k];
    const o = merged[k];
    if (typeof w !== "number") continue;
    wsum += w;
    filled += w * objFill(asObj(o));
  }
  const comp = merged.competitors;
  filled += weights.competitors * (Array.isArray(comp) ? Math.min(1, comp.length / 3) : 0);
  wsum += weights.competitors;
  const obj = merged.objections;
  filled += weights.objections * (Array.isArray(obj) ? Math.min(1, obj.length / 5) : 0);
  wsum += weights.objections;
  return Math.round(Math.min(100, (filled / Math.max(wsum, 1)) * 100));
}

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function formatMergedMemoryForAi(mergedSections: Record<string, unknown>): string {
  const c = asObj(mergedSections.company);
  const f = asObj(mergedSections.founder);
  const p = asObj(mergedSections.product);
  const a = asObj(mergedSections.audience);
  const pd = asObj(mergedSections.pains_desires);
  const o = asObj(mergedSections.offer_positioning);
  const w = asObj(mergedSections.websites);
  const pr = asObj(mergedSections.proofs);
  const prc = asObj(mergedSections.pricing);
  const bm = asObj(mergedSections.business_metrics);
  const tn = asObj(mergedSections.tone);
  const cs = asObj(mergedSections.constraints);
  const comp = Array.isArray(mergedSections.competitors) ? mergedSections.competitors : [];
  const objections = Array.isArray(mergedSections.objections) ? mergedSections.objections : [];

  const compLines = comp
    .slice(0, 8)
    .map((kRaw) => {
      const k = asObj(kRaw);
      return [[k.name, k.url].filter(Boolean).join(" — "), k.positioning, k.notes].filter(Boolean).join(" · ");
    })
    .filter(Boolean);

  const objLines = objections.slice(0, 10).map((xRaw) => {
    const x = asObj(xRaw);
    return [x.objection, x.answer, x.proof].filter(Boolean).join(" → ");
  });

  const pct = calculateCompletionApproxFromMerged(mergedSections);

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
      ln("Продукт", p.product_name),
      ln("Описание продукта", p.product_description),
      ln("Главный результат", p.product_core_result),
      ln("УТП продукта (механизм)", p.product_unique_mechanism),
      ln("ЦА", a.target_audience),
      ln("Главная боль", pd.main_pain),
      ln("Главное желание", pd.main_desire),
      ln("JTBD", pd.jobs_to_be_done),
      ln("Текущий оффер", o.current_offer),
      ln("Обещание", o.key_promise),
      ln("Позиционирование", o.positioning),
      ln("Призыв к действию", o.call_to_action),
      ln("Основной сайт / лендинг", w.main_website_url),
      ln("Цель лендинга", w.current_landing_goal),
      ln("Главная проблема лендинга", w.current_landing_problem),
      ...(compLines.length ? [`Конкуренты: ${compLines.join(" | ")}`] : []),
      ln("Отзывы и доказательства", pr.testimonials),
      ln("Кейсы", pr.cases),
      ln("Цифры", pr.numbers),
      ...(objLines.length ? [`Возражения: ${objLines.join(" ;; ")}`] : []),
      ln("Модель цены", prc.pricing_model),
      ln("Тарифы", prc.packages),
      ln("Выручка в месяц", bm.monthly_revenue),
      ln("Конверсия сайта", bm.conversion_rate),
      ln("Тон коммуникации", tn.tone_of_voice),
      ln("Ограничения", cs.legal_constraints ?? cs.things_not_to_say),
    ].filter((x): x is string => Boolean(x)),
    "",
    `Заполненность памяти проекта по структуре (оценочно для модели): ~${pct}%.`,
  ];

  const weak: string[] = [];
  const proofPct = proofsProgressApprox(pr);
  const compCount = comp.filter((kRaw) => {
    const k = asObj(kRaw);
    return String(k.url ?? "").trim() || String(k.name ?? "").trim();
  }).length;
  const objCount = objections.filter((xRaw) => String(asObj(xRaw).objection ?? "").trim()).length;

  if (proofPct < 0.35) weak.push("доказательств и доверия");
  if (compCount < 2) weak.push("конкурентной отстройки");
  if (objCount < 2) weak.push("возражений");

  if (pct < 40 || weak.length) {
    parts.push(
      "",
      "Часть данных в памяти проекта может быть неполной. Если мало информации про " +
        (weak.length ? weak.join(", ") : "общий контекст") +
        ", снижай уверенность в рекомендациях и перечисли, чего не хватает.",
    );
  }

  return parts.join("\n");
}

export function normalizeMemoryRowSections(row: Record<string, unknown>): Record<string, unknown> {
  return {
    company: asObj(row.company),
    founder: asObj(row.founder),
    product: asObj(row.product),
    audience: asObj(row.audience),
    pains_desires: asObj(row.pains_desires),
    offer_positioning: asObj(row.offer_positioning),
    websites: asObj(row.websites),
    competitors: Array.isArray(row.competitors) ? row.competitors : [],
    proofs: asObj(row.proofs),
    objections: Array.isArray(row.objections) ? row.objections : [],
    pricing: asObj(row.pricing),
    business_metrics: asObj(row.business_metrics),
    tone: asObj(row.tone),
    constraints: asObj(row.constraints),
  };
}
