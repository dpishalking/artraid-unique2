import type { Audit } from "@/components/AuditDashboard";
import type { AuditFocusSectionId } from "@/config/auditSections";

export type ResolvedAuditFocus = {
  currentState: string;
  conversionProblem: string;
  visitorFeeling: string;
  improvement: string;
  nextStep: string;
};

function sortBlocks(blocks: Audit["blocks"]) {
  return [...(blocks ?? [])].sort((a, b) => (a.priorityRank ?? 99) - (b.priorityRank ?? 99));
}

export function softenLong(s: string, max = 480) {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trim()}…`;
}

export function resolveAuditFocusContent(sectionId: AuditFocusSectionId, audit: Audit): ResolvedAuditFocus {
  const probs = audit.problems ?? [];
  const blocks = sortBlocks(audit.blocks ?? []);
  const main = audit.diagnosis.mainProblem;
  const leak = audit.diagnosis.mainMoneyLeak;
  const lever = audit.diagnosis.mainLever ?? "Свести главный экран, оффер и доверие к одному обещанию с короткой проверкой на скепсис.";
  const p0 = probs[0];
  const b0 = blocks[0];

  const joinThoughts = (n: number) =>
    probs
      .filter((p) => p.customerThought?.trim())
      .slice(0, n)
      .map((p, i) => `${i + 1}. «${p.customerThought!.trim()}»`)
      .join(" ");

  switch (sectionId) {
    case "offer": {
      const score = audit.offerScore;
      if (score) {
        const fixHint =
          probs.find((pr) => /оффер|цена|гарант/i.test(pr.title))?.howToFix?.[0] ??
          "Привязать главный текст к измеримому результату клиента за понятный срок и добавить маленький факт-доказательство рядом с кнопкой.";
        return {
          currentState: softenLong(
            `Через фильтры сильного оффера: ${score.verdict} Ориентир по сумме параметров — ${score.totalScore}. Рычаг сейчас: ${score.biggestLever}.`,
          ),
          conversionProblem: softenLong(
            `${[score.likelihoodComment, score.timeComment, score.effortComment].filter(Boolean).join("\n")}`.trim() ||
              probs[0]?.whyItHurts ||
              main,
          ),
          visitorFeeling: softenLong(score.dreamComment || "Клиент считает риски, альтернативы и «честность интонации» быстрее, чем вы успеваете дочитать лендинг."),
          improvement: softenLong(fixHint),
          nextStep: "Выберите одну версию главного оффера и один честный элемент доказательства рядом с кнопкой — затем промерить за неделю трафиком.",
        };
      }
      return {
        currentState: softenLong(main),
        conversionProblem: softenLong(leak),
        visitorFeeling: joinThoughts(2) || softenLong(probs.find((pr) => pr.customerThought)?.customerThought ?? ""),
        improvement: softenLong(p0?.howToFix?.join(" ") ?? b0?.howToFix ?? ""),
        nextStep:
          "Сформулируйте главное обещание в одном предложении и проверьте: если убрать логотип, всё ли ещё ясно, зачем оставить контакт именно здесь?",
      };
    }

    case "first_screen": {
      const fs = audit.firstScreenRewrite;
      if (fs) {
        return {
          currentState: softenLong(`${fs.h1} — подзаговор: ${fs.subtitle}`),
          conversionProblem: softenLong(leak),
          visitorFeeling: softenLong(joinThoughts(2) || "Без простого следующего шага голова уходит искать более «безопасный» сайт."),
          improvement: softenLong(
            `${fs.removeList.slice(0, 3).join("; ")} Что добавить рядом: ${fs.proofNearby}`,
          ),
          nextStep: `Подсказка по кнопке: «${softenLong(fs.cta, 120)}». ${softenLong(fs.microtext, 140)}`,
        };
      }
      const heroBlock = blocks.find((bl) => /герой|перв|экран|hero/i.test(bl.name));
      const hb = heroBlock ?? b0;
      return {
        currentState: softenLong(hb?.problem ?? main),
        conversionProblem: softenLong(hb?.whyImportant ?? leak),
        visitorFeeling: joinThoughts(2),
        improvement: softenLong(hb?.howToFix ?? ""),
        nextStep:
          audit.meclabsScore?.interpretation
            ? softenLong(audit.meclabsScore.interpretation)
            : "Срежьте лишнее с первых 600 px: один исход клиента и одно действие, которое понятно до скролла.",
      };
    }

    case "trust_gap": {
      const r = audit.resistanceMap?.[0];
      const p = audit.proofMap?.[0];
      return {
        currentState: softenLong(
          r
            ? `${r.moment}: на сайте сказано «${softenLong(r.whatSiteSays, 160)}»`
            : p
              ? `Обещание: «${p.promise}». Для закрытия заявленного заявлен довод: «${softenLong(p.proofThatCloses, 180)}».`
              : main,
        ),
        conversionProblem: softenLong(
          r
            ? leak
            : p
              ? `Не хватает: «${softenLong(p.missing, 260)}».`
              : leak,
        ),
        visitorFeeling: softenLong(
          r?.whatClientThinks ?? joinThoughts(2) ?? "Подозрительно тихо про людей и про то, как это выглядит на практике.",
        ),
        improvement: softenLong(r?.howToRespond ?? p?.proofThatCloses ?? b0?.howToFix ?? ""),
        nextStep: "Добавьте один честный факт рядом с обещанием: кто уже прошёл, что получил через 48 часов, что будет, если не зайдёт.",
      };
    }

    case "cta_friction": {
      const ct = audit.ctaPath;
      const m = audit.meclabsScore;
      return {
        currentState: softenLong(
          ct
            ? `Кнопка ведёт: «${softenLong(ct.leadsTo, 200)}». Видят: «${softenLong(ct.userSees, 200)}».`
            : m
              ? `По шкале действия заметно низкое влияние стимула и высокое трение: ${softenLong(m.interpretation, 220)}`
              : main,
        ),
        conversionProblem: softenLong(ct?.friction ?? m?.frictionComment ?? probs[0]?.whyItHurts ?? ""),
        visitorFeeling: softenLong(joinThoughts(2) ?? "Страшновато оставлять контакт, не понимая времени ответа и формата разговора."),
        improvement: softenLong(ct?.afterForm ?? probs[0]?.howToFix?.join(" ") ?? ""),
        nextStep: lever,
      };
    }

    case "structure": {
      const names = blocks.slice(0, 6).map((bl) => `• ${bl.name} (${BLOCK_STATUS_LITE[bl.status] ?? bl.status})`);
      const head = blocks[0];
      return {
        currentState: softenLong(names.join("\n") || "Структура страницы читается, но ключевые смыслы размазаны по скроллу."),
        conversionProblem: softenLong(head?.whyImportant ?? leak),
        visitorFeeling: joinThoughts(2),
        improvement: softenLong(head?.problem ? `${head.problem} — ${head.howToFix}` : p0?.howToFix.join(" ") ?? ""),
        nextStep:
          audit.funnel?.insight
            ? softenLong(audit.funnel.insight)
            : "Перетащите «почему вам можно верить» ближе к первому офферу и к повторному CTA в середине листа.",
      };
    }

    case "client_lens": {
      const thoughts = topThoughtsSorted(probs);
      return {
        currentState: softenLong(
          thoughts.length
            ? "Вот несколько синтезированных мыслей, которые уже просачиваются между строками разбора."
            : joinThoughts(1) ||
                "Клиентские мысли в отчёте не выделены отдельно — берём смесь топ-проблем и утечек.",
        ),
        conversionProblem: softenLong(probs.slice(0, 2).map((pr) => pr.whyItHurts).join(" ") || main),
        visitorFeeling: softenLong(joinThoughts(4)),
        improvement: softenLong(lever),
        nextStep:
          audit.softOffer?.steps?.slice(0, 2)?.join(" → ") ??
          "Сначала переформулируйте одну мысль посетителя в честный подзаголовок и проверьте его на живом человеке вне вашей команды.",
      };
    }

    case "quick_wins": {
      const q = audit.quickestWin;
      const qw = audit.roadmap?.quickWins ?? [];
      return {
        currentState: softenLong(q?.action ?? qw[0]?.action ?? main),
        conversionProblem: softenLong(q?.why ?? probs[0]?.whyItHurts ?? ""),
        visitorFeeling: joinThoughts(2),
        improvement: softenLong(q?.expectedEffect ?? qw.map((w) => w.expectedEffect).filter(Boolean)[0] ?? ""),
        nextStep: softenLong(lever),
      };
    }

    case "money_map": {
      const funnel = audit.funnel;
      const leaks = audit.moneyLeaks?.items ?? [];
      return {
        currentState: softenLong(
          funnel
            ? `Воронка: ${funnel.stages.map((st) => `${st.name} ≈ ${st.percent}% (${st.dropReason})`).join(" → ")}`
            : leaks.map((l, i) => `${i + 1}. ${l.reason} (${l.lossPercent})`).join("; ") ||
                leak,
        ),
        conversionProblem: softenLong(funnel?.insight ?? leaks[0]?.reason ?? leak),
        visitorFeeling: joinThoughts(2),
        improvement: softenLong(
          audit.moneyLeaks?.totalLoss
            ? `Суммирующая оценка по зонам молчаливого выхода: ${audit.moneyLeaks.totalLoss}.`
            : main,
        ),
        nextStep:
          audit.waterfall?.insight
            ? softenLong(audit.waterfall.insight)
            : "Начать с узла с наибольшим влиянием на экономику лида или на долю качественных входящих, перед тем как улучшать второстепенные блоки.",
      };
    }
  }
}

const BLOCK_STATUS_LITE: Partial<Record<Audit["blocks"][number]["status"], string>> = {
  critical: "узкое горлышко",
  bad: "слабо",
  weak: "выравниваем",
  ok: "держится",
  good: "сильное место",
};

function topThoughtsSorted(problems: Audit["problems"]) {
  return [...problems]
    .filter((p) => p.customerThought?.trim())
    .sort((a, b) => (b.impactScore ?? 0) - (a.impactScore ?? 0))
    .slice(0, 5);
}
