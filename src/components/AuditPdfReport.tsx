import { forwardRef } from "react";
import type { Audit } from "./AuditDashboard";

const SEV_LABEL: Record<Audit["problems"][number]["severity"], string> = {
  critical: "Критично",
  important: "Важно",
  minor: "Можно улучшить",
};

const BLOCK_LABEL: Record<Audit["blocks"][number]["status"], string> = {
  critical: "Критично",
  bad: "Провал",
  weak: "Слабо",
  ok: "Норм",
  good: "Сильно",
};

// Атомарный блок-секция для PDF: каждый Section не будет разрезан между страницами
function S({ children }: { children: React.ReactNode }) {
  return (
    <div data-pdf-section className="break-inside-avoid mb-4">
      {children}
    </div>
  );
}

function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="font-display text-[26px] font-bold leading-tight text-zinc-900 mb-1">
      {children}
    </h1>
  );
}
function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-[18px] font-bold leading-tight text-zinc-900 mb-2 pb-1 border-b border-zinc-300">
      {children}
    </h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display text-[15px] font-semibold text-zinc-900 mb-1">
      {children}
    </h3>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wide text-zinc-500 font-semibold mb-0.5">
      {children}
    </div>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] leading-relaxed text-zinc-800">{children}</p>;
}

export const AuditPdfReport = forwardRef<HTMLDivElement, { audit: Audit; siteUrl?: string }>(
  ({ audit, siteUrl }, ref) => {
    return (
      <div
        ref={ref}
        // Ширина под A4 при html2canvas (контентная зона ~ 182мм ≈ 720px при 96dpi)
        className="bg-white text-zinc-900 p-8"
        style={{ width: 760, fontFamily: "Inter, system-ui, sans-serif" }}
      >
        {/* Title */}
        <S>
          <div className="mb-4">
            <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-semibold">
              AI-разбор сайта
            </div>
            <H1>Отчёт по конверсии</H1>
            {siteUrl && (
              <div className="text-[12px] text-zinc-600 mt-1 break-all">{siteUrl}</div>
            )}
            <div className="text-[11px] text-zinc-500 mt-1">
              {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          </div>
        </S>

        {/* Diagnosis */}
        <S>
          <H2>1. Быстрый диагноз</H2>
        </S>
        {audit.diagnosis.metrics.map((m) => (
          <S key={m.name}>
            <div className="flex items-baseline justify-between gap-3">
              <H3>{m.name}</H3>
              <div className="font-display text-[15px] font-bold text-zinc-900">
                {m.score}<span className="text-zinc-500 font-normal">/10</span>
              </div>
            </div>
            <P>{m.comment}</P>
          </S>
        ))}
        <S>
          <Label>🔴 Главная проблема</Label>
          <P>{audit.diagnosis.mainProblem}</P>
        </S>
        <S>
          <Label>💸 Главная утечка денег</Label>
          <P>{audit.diagnosis.mainMoneyLeak}</P>
        </S>
        <S>
          <Label>📉 Недополученная прибыль</Label>
          <P>{audit.diagnosis.estimatedLossPercent} от потенциальной выручки</P>
        </S>
        {audit.diagnosis.mainLever && (
          <S>
            <Label>⚡ Главный рычаг (1–2 недели)</Label>
            <div className="text-[14px] font-semibold leading-snug text-zinc-900">
              {audit.diagnosis.mainLever}
            </div>
          </S>
        )}

        {/* Problems */}
        <S>
          <H2>2. Основные проблемы</H2>
        </S>
        {audit.problems.map((p, i) => (
          <S key={i}>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
              {SEV_LABEL[p.severity]} · ⏱ {p.effort} · 💥 impact {p.impactScore}/10
            </div>
            <H3>№{i + 1}. {p.title}</H3>
            {p.customerThought && (
              <div className="mt-2 border-l-4 border-zinc-900 pl-4 py-1">
                <div className="text-[14px] leading-relaxed italic text-zinc-900">
                  <span className="font-display text-2xl leading-none align-text-top mr-1 text-zinc-400">❝</span>
                  {p.customerThought}
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500 font-semibold">
                  — мысль вашего клиента
                </div>
              </div>
            )}
            <div className="mt-2 space-y-2">
              <div>
                <Label>🎯 Почему снижает конверсию</Label>
                <P>{p.whyItHurts}</P>
              </div>
              <div>
                <Label>💰 Как влияет на деньги</Label>
                <P>{p.moneyImpact}</P>
              </div>
              <div>
                <Label>📌 Как исправить</Label>
                <ul className="space-y-1 list-disc pl-5 text-[13px] text-zinc-800 leading-relaxed">
                  {p.howToFix.map((f, j) => (
                    <li key={j}>{f}</li>
                  ))}
                </ul>
              </div>
            </div>
          </S>
        ))}

        {/* Blocks */}
        <S>
          <H2>3. Разбор по блокам</H2>
        </S>
        {audit.blocks.map((b, i) => (
          <S key={i}>
            <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
              {BLOCK_LABEL[b.status]}
            </div>
            <H3>{i + 1}. {b.name}</H3>
            <div className="mt-2 space-y-2">
              <div>
                <Label>Проблема</Label>
                <P>{b.problem}</P>
              </div>
              <div>
                <Label>Почему важно</Label>
                <P>{b.whyImportant}</P>
              </div>
              <div>
                <Label>Как исправить</Label>
                <P>{b.howToFix}</P>
              </div>
            </div>
          </S>
        ))}

        {/* Money leaks */}
        <S>
          <H2>4. Где теряются деньги</H2>
        </S>
        {audit.moneyLeaks.items.map((it, i) => (
          <S key={i}>
            <div className="flex items-start justify-between gap-3">
              <P>{it.reason}</P>
              <div className="font-display text-[13px] font-bold text-zinc-900 whitespace-nowrap">
                {it.lossPercent}
              </div>
            </div>
            {it.verification && (
              <div className="mt-1 text-[11px] text-zinc-600">
                Замер: {it.verification}
              </div>
            )}
          </S>
        ))}
        <S>
          <Label>Суммарная потеря от трафика</Label>
          <div className="font-display text-[18px] font-bold text-zinc-900">
            {audit.moneyLeaks.totalLoss}
          </div>
        </S>

        {/* Growth */}
        <S>
          <H2>5. Потенциал роста</H2>
          <P>Если исправить ключевые ошибки</P>
        </S>
        <S>
          <Label>Рост заявок</Label>
          <div className="font-display text-[18px] font-bold text-zinc-900">
            {audit.growthPotential.requestsGrowth}
          </div>
        </S>
        <S>
          <Label>Рост конверсии</Label>
          <div className="font-display text-[18px] font-bold text-zinc-900">
            {audit.growthPotential.conversionGrowth}
          </div>
        </S>
        <S>
          <Label>Логика роста выручки</Label>
          <P>{audit.growthPotential.revenueLogic}</P>
          {(audit.growthPotential.confidence || audit.growthPotential.verification) && (
            <div className="mt-1 text-[11px] text-zinc-600">
              {audit.growthPotential.confidence && (
                <>Возможный эффект: <strong>{audit.growthPotential.confidence}</strong>. </>
              )}
              {audit.growthPotential.verification && <>Замер: {audit.growthPotential.verification}</>}
            </div>
          )}
        </S>

        {/* Resistance map */}
        {audit.resistanceMap?.length ? (
          <>
            <S>
              <H2>Карта сопротивлений</H2>
              <P>Где сайт молчит, а клиент думает «не моё»</P>
            </S>
            {audit.resistanceMap.map((r, i) => (
              <S key={i}>
                <H3>{r.moment}</H3>
                <div className="mt-1 space-y-1">
                  <div><Label>На сайте</Label><P>{r.whatSiteSays}</P></div>
                  <div><Label>Что думает клиент</Label><div className="text-[13px] italic text-zinc-800">«{r.whatClientThinks}»</div></div>
                  <div><Label>Чем ответить</Label><P>{r.howToRespond}</P></div>
                </div>
              </S>
            ))}
          </>
        ) : null}

        {/* Proof map */}
        {audit.proofMap?.length ? (
          <>
            <S>
              <H2>Карта доказательств</H2>
              <P>Каждое обещание → что закрывает → чего нет</P>
            </S>
            {audit.proofMap.map((p, i) => (
              <S key={i}>
                <H3>{p.promise}</H3>
                <div className="mt-1 space-y-1">
                  <div><Label>Что закрывает</Label><P>{p.proofThatCloses}</P></div>
                  <div><Label>Чего нет</Label><P>{p.missing}</P></div>
                </div>
              </S>
            ))}
          </>
        ) : null}

        {/* First screen rewrite */}
        {audit.firstScreenRewrite && (
          <>
            <S>
              <H2>Первый экран после переписи</H2>
              <P>Готовое ТЗ для дизайнера и копирайтера</P>
            </S>
            <S>
              <Label>H1</Label>
              <div className="font-display text-[18px] font-bold leading-tight text-zinc-900">
                {audit.firstScreenRewrite.h1}
              </div>
              <P>{audit.firstScreenRewrite.subtitle}</P>
              <ul className="mt-2 list-disc pl-5 text-[13px] text-zinc-800 leading-relaxed">
                {audit.firstScreenRewrite.bullets.map((b, i) => <li key={i}>{b}</li>)}
              </ul>
              <div className="mt-2 text-[13px] text-zinc-900">
                <strong>CTA:</strong> {audit.firstScreenRewrite.cta}
              </div>
              <div className="text-[11px] text-zinc-600">
                {audit.firstScreenRewrite.microtext}
              </div>
            </S>
            <S>
              <Label>Что показать рядом</Label><P>{audit.firstScreenRewrite.proofNearby}</P>
            </S>
            <S>
              <Label>Что убрать</Label>
              <ul className="list-disc pl-5 text-[13px] text-zinc-800 leading-relaxed">
                {audit.firstScreenRewrite.removeList.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </S>
            <S>
              <Label>Визуал</Label><P>{audit.firstScreenRewrite.visualHint}</P>
            </S>
          </>
        )}

        {/* CTA path */}
        {audit.ctaPath && (
          <>
            <S>
              <H2>Путь после кнопки</H2>
              <P>Здесь часто прячутся 30–50% потерь</P>
            </S>
            <S><Label>Куда ведёт</Label><P>{audit.ctaPath.leadsTo}</P></S>
            <S><Label>Что видит</Label><P>{audit.ctaPath.userSees}</P></S>
            <S><Label>Где трение</Label><P>{audit.ctaPath.friction}</P></S>
            <S><Label>Что после формы</Label><P>{audit.ctaPath.afterForm}</P></S>
          </>
        )}

        {/* Money hierarchy */}
        {audit.moneyHierarchy && (
          <>
            <S>
              <H2>Три уровня денег</H2>
              <P>Что брать сейчас, что потом, что в горизонте месяца</P>
            </S>
            {([
              { title: "Деньги поверхности (1–2 дня)", items: audit.moneyHierarchy.surface },
              { title: "Деньги доверия (1–2 недели)", items: audit.moneyHierarchy.trust },
              { title: "Деньги упаковки (3–4 недели)", items: audit.moneyHierarchy.product },
            ]).map((col, ci) => (
              <S key={ci}>
                <H3>{col.title}</H3>
                <ul className="list-disc pl-5 text-[13px] text-zinc-800 leading-relaxed">
                  {(col.items || []).map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </S>
            ))}
          </>
        )}

        {/* Before/After */}
        {audit.beforeAfter?.length > 0 && (
          <>
            <S>
              <H2>6. Было / Стало</H2>
              <P>Готовые формулировки — можно вставлять на сайт</P>
            </S>
            {audit.beforeAfter.map((b, i) => (
              <S key={i}>
                <H3>{b.label}</H3>
                <div className="mt-2 space-y-2">
                  <div>
                    <Label>✗ Было</Label>
                    <div className="text-[13px] leading-relaxed text-zinc-800 border-l-2 border-zinc-400 pl-3 italic">
                      {b.before}
                    </div>
                  </div>
                  <div>
                    <Label>✓ Стало</Label>
                    <div className="text-[13px] leading-relaxed text-zinc-900 font-medium border-l-2 border-zinc-900 pl-3">
                      {b.after}
                    </div>
                  </div>
                </div>
              </S>
            ))}
          </>
        )}

        {/* Waterfall */}
        {audit.waterfall?.steps?.length ? (
          <>
            <S>
              <H2>7. Каскад роста конверсии</H2>
              <P>Вклад каждого фикса в конверсию — от текущей к итоговой</P>
            </S>
            <S>
              <div className="flex items-baseline justify-between gap-3">
                <Label>CR сейчас</Label>
                <div className="font-display text-[15px] font-bold">
                  {audit.waterfall.currentConversion.toFixed(1)}%
                </div>
              </div>
            </S>
            {audit.waterfall.steps.map((s, i) => (
              <S key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <H3>+ {s.label}</H3>
                  <div className="font-display text-[14px] font-bold text-zinc-900 whitespace-nowrap">
                    +{s.uplift.toFixed(2)} п.п.
                  </div>
                </div>
                <P>{s.rationale}</P>
              </S>
            ))}
            <S>
              <div className="flex items-baseline justify-between gap-3">
                <Label>CR после фиксов</Label>
                <div className="font-display text-[18px] font-bold">
                  {audit.waterfall.finalConversion.toFixed(1)}%
                </div>
              </div>
            </S>
            <S>
              <Label>💰 Главный вывод</Label>
              <P>{audit.waterfall.insight}</P>
            </S>
          </>
        ) : null}

        {/* Offer Score (Hormozi) */}
        {audit.offerScore && (
          <>
            <S>
              <H2>8. Сила оффера</H2>
              <P>Формула: (Результат × Правдоподобность) ÷ (Сроки × Усилия) · Каждое 1–10</P>
            </S>
            <S>
              <div className="flex items-baseline justify-between gap-3">
                <Label>Итоговый балл оффера</Label>
                <div className="font-display text-[18px] font-bold">{audit.offerScore.totalScore.toFixed(1)}/10</div>
              </div>
            </S>
            {[
              { label: "🎯 Картина результата (Dream)", v: audit.offerScore.dream, c: audit.offerScore.dreamComment },
              { label: "🛡 Правдоподобность", v: audit.offerScore.likelihood, c: audit.offerScore.likelihoodComment },
              { label: "⏱ Скорость результата", v: audit.offerScore.timeDelay, c: audit.offerScore.timeComment },
              { label: "🪶 Простота шага", v: audit.offerScore.effort, c: audit.offerScore.effortComment },
            ].map((m, i) => (
              <S key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <H3>{m.label}</H3>
                  <div className="font-display text-[15px] font-bold">{m.v}<span className="text-zinc-500 font-normal">/10</span></div>
                </div>
                <P>{m.c}</P>
              </S>
            ))}
            <S>
              <Label>⚖️ Вердикт</Label>
              <P>{audit.offerScore.verdict}</P>
            </S>
            <S>
              <Label>🚀 Главный рычаг усиления</Label>
              <P>{audit.offerScore.biggestLever}</P>
            </S>
          </>
        )}

        {/* Market Context */}
        {audit.marketContext && (
          <>
            <S>
              <H2>9. Контекст рынка</H2>
              <P>Уровень насыщения и осознанность трафика</P>
            </S>
            <S>
              <div className="flex items-baseline justify-between gap-3">
                <H3>Насыщенность рынка</H3>
                <div className="font-display text-[15px] font-bold">{audit.marketContext.sophisticationLevel}/5</div>
              </div>
              <P>{audit.marketContext.sophisticationComment}</P>
            </S>
            <S>
              <H3>Уровень осознанности трафика</H3>
              <div className="text-[12px] text-zinc-700 font-medium">{audit.marketContext.awarenessLevel}</div>
              <P>{audit.marketContext.awarenessComment}</P>
            </S>
            <S>
              <Label>⚠️ Главный конфликт</Label>
              <P>{audit.marketContext.mismatch}</P>
            </S>
            <S>
              <Label>🔧 Уникальный механизм</Label>
              <P>{audit.marketContext.uniqueMechanism}</P>
            </S>
          </>
        )}

        {/* MECLABS */}
        {audit.meclabsScore && (
          <>
            <S>
              <H2>11. Скоринг главного экрана</H2>
              <P>C = 4×Мотивация + 3×Ценность + 2×(Стимул − Трение) − 2×Тревога</P>
            </S>
            <S>
              <div className="flex items-baseline justify-between gap-3">
                <Label>Итоговый балл</Label>
                <div className="font-display text-[18px] font-bold">{audit.meclabsScore.score.toFixed(0)}/90</div>
              </div>
            </S>
            {[
              { label: "🔥 Мотивация ×4", v: audit.meclabsScore.motivation, c: audit.meclabsScore.motivationComment },
              { label: "💎 Ценность ×3", v: audit.meclabsScore.valueProposition, c: audit.meclabsScore.valueComment },
              { label: "🎁 Стимул ×2", v: audit.meclabsScore.incentive, c: audit.meclabsScore.incentiveComment },
              { label: "🧱 Трение ×2 (ниже = лучше)", v: audit.meclabsScore.friction, c: audit.meclabsScore.frictionComment },
              { label: "😰 Тревога ×2 (ниже = лучше)", v: audit.meclabsScore.anxiety, c: audit.meclabsScore.anxietyComment },
            ].map((m, i) => (
              <S key={i}>
                <div className="flex items-baseline justify-between gap-3">
                  <H3>{m.label}</H3>
                  <div className="font-display text-[15px] font-bold">{m.v}<span className="text-zinc-500 font-normal">/10</span></div>
                </div>
                <P>{m.c}</P>
              </S>
            ))}
            <S>
              <Label>💡 Интерпретация</Label>
              <P>{audit.meclabsScore.interpretation}</P>
            </S>
          </>
        )}

        {/* Roadmap */}
        {audit.roadmap && (
          <>
            <S>
              <H2>12. План внедрения</H2>
              <P>Сортировка по ROI: где быстрее всего получить деньги</P>
            </S>
            {[
              { title: "🚀 Сегодня (1 день · максимальный ROI)", items: audit.roadmap.quickWins },
              { title: "📅 На неделю (до 7 дней работы)", items: audit.roadmap.thisWeek },
              { title: "🎯 На месяц (стратегические правки)", items: audit.roadmap.thisMonth },
            ].map((col, ci) => (
              <div key={ci}>
                <S>
                  <H3>{col.title}</H3>
                </S>
                {col.items?.length ? (
                  col.items.map((it, i) => (
                    <S key={i}>
                      <P>
                        <strong>{i + 1}.</strong> {it.action}
                      </P>
                      <div className="text-[12px] text-zinc-600 mt-1">
                        Эффект: {it.expectedEffect}
                      </div>
                    </S>
                  ))
                ) : (
                  <S>
                    <P>—</P>
                  </S>
                )}
              </div>
            ))}
          </>
        )}

        {/* System */}
        <S>
          <H2>13. Сайт — это часть системы</H2>
          <P>{audit.systemMessage}</P>
          <div className="mt-2 text-[12px] text-zinc-600">
            Трафик → Конверсия → Продажи → Дожим
          </div>
        </S>

        {/* Final CTA — личный разбор 1-на-1 */}
        <S>
          <div className="rounded-xl border-2 border-zinc-900 bg-zinc-50 p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-900">
              Следующий шаг
            </div>
            <div className="mt-1.5 font-display text-[16px] font-bold leading-snug text-zinc-900">
              Хочешь подробный разбор 1-на-1?
            </div>
            <P>
              AI-отчёт показывает картину сверху. На созвоне разберём каждую проблему руками — с
              готовыми текстами, структурой блоков и приоритетами по ROI.
            </P>
            <div className="mt-2 text-[13px] font-bold text-zinc-900">
              Telegram: @d_pishalking · t.me/d_pishalking
            </div>
          </div>
        </S>
      </div>
    );
  }
);
AuditPdfReport.displayName = "AuditPdfReport";
