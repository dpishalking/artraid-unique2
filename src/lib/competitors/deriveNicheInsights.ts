/**
 * Derives plain-language verdicts from niche snapshot artifacts.
 * Pure function — no API calls, instant, no re-deploy needed.
 */
import type {
  NicheSnapshot,
  NicheSnapshotArtifacts,
  PositioningMapPoint,
} from "./types";

const AWARENESS_RU: Record<string, string> = {
  unaware: "не знают о проблеме",
  problem: "осознают проблему",
  solution: "ищут решение",
  product: "выбирают продукт",
  most: "готовы купить",
};

const AWARENESS_ADJ: Record<string, string> = {
  unaware: "холодной",
  problem: "проблемной",
  solution: "решенческой",
  product: "продуктовой",
  most: "горячей",
};

export type NicheVerdict = {
  id: string;
  /** green | amber | red | blue */
  tone: "green" | "amber" | "red" | "blue";
  headline: string;
  detail: string;
};

export type NicheInsights = {
  verdicts: NicheVerdict[];
  /** Primary recommendation — shown as the biggest CTA */
  topRecommendation: string;
};

function selfPoint(artifacts: NicheSnapshotArtifacts): PositioningMapPoint | null {
  return artifacts.positioning_map?.points.find((p) => p.is_self) ?? null;
}
function compPoints(artifacts: NicheSnapshotArtifacts): PositioningMapPoint[] {
  return artifacts.positioning_map?.points.filter((p) => !p.is_self) ?? [];
}

/** Main entry point */
export function deriveNicheInsights(snapshot: NicheSnapshot): NicheInsights {
  const a = snapshot.artifacts;
  const verdicts: NicheVerdict[] = [];

  // ── 1. Positioning verdict ──────────────────────────────────────────────
  const self = selfPoint(a);
  const comps = compPoints(a);

  if (self) {
    const sameAwareness = comps.filter((c) => c.awareness === self.awareness);
    const crowded = sameAwareness.length >= comps.length * 0.5 && comps.length >= 2;
    const emptyZones = a.positioning_map?.empty_zones ?? [];
    if (crowded) {
      verdicts.push({
        id: "positioning_crowded",
        tone: "amber",
        headline: `Вы в переполненной зоне — ${sameAwareness.length + 1} из ${comps.length + 1} игроков говорят одной аудитории`,
        detail: `Все конкуренты работают с ${AWARENESS_ADJ[self.awareness] ?? self.awareness} аудиторией. Читатель видит одинаковые офферы и переключается на цену.`,
      });
    } else {
      verdicts.push({
        id: "positioning_ok",
        tone: "green",
        headline: `Вы нашли свою позицию — говорите с ${AWARENESS_RU[self.awareness] ?? self.awareness}`,
        detail: `Большинство конкурентов работают с другой аудиторией. Это снижает прямое сравнение и позволяет говорить на своём языке.`,
      });
    }
    if (emptyZones.length > 0) {
      verdicts.push({
        id: "empty_zones",
        tone: "blue",
        headline: `Есть пустые зоны — туда никто не смотрит`,
        detail: `Никто из конкурентов не работает с этими сегментами: ${emptyZones.slice(0, 2).join(", ")}. Это потенциал для нового контента или линейки.`,
      });
    }
  }

  // ── 2. Hormozi / value score ─────────────────────────────────────────────
  const sc = a.scorecard;
  if (sc && sc.you.length > 0 && sc.median.length > 0) {
    const youTotal = sc.you.reduce((s, n) => s + n, 0) / sc.you.length;
    const medTotal = sc.median.reduce((s, n) => s + n, 0) / sc.median.length;
    const topTotal = sc.top.reduce((s, n) => s + n, 0) / sc.top.length;
    const gap = youTotal - medTotal;
    const weakIdx = sc.you
      .map((v, i) => ({ v, i }))
      .sort((a, b) => (a.v - sc.median[a.i]) - (b.v - sc.median[b.i]))[0];
    const weakAxis = sc.axes[weakIdx?.i ?? 0] ?? "одной из осей";

    if (gap >= 5) {
      verdicts.push({
        id: "hormozi_strong",
        tone: "green",
        headline: `Ваш оффер сильнее среднего по рынку (+${Math.round(gap)} пунктов)`,
        detail: `Вы выше медианы ниши. Лидер — ${Math.round(topTotal)} п. Чтобы догнать его, усильте «${weakAxis}» — там наибольший разрыв.`,
      });
    } else if (gap >= -5) {
      verdicts.push({
        id: "hormozi_avg",
        tone: "amber",
        headline: `Ваш оффер на уровне рынка — вы не выделяетесь`,
        detail: `Покупатель видит похожие предложения. Самый слабый показатель — «${weakAxis}». Усильте его конкретными цифрами или гарантией.`,
      });
    } else {
      verdicts.push({
        id: "hormozi_weak",
        tone: "red",
        headline: `Ваш оффер слабее среднего по рынку (−${Math.round(Math.abs(gap))} пунктов)`,
        detail: `Начните с «${weakAxis}» — это самое большое отставание. Один усиленный элемент поднимает общий score быстрее, чем равномерная работа по всем.`,
      });
    }
  }

  // ── 3. Trust gaps ────────────────────────────────────────────────────────
  const pulse = a.niche_pulse;
  if (pulse?.unused_triggers && pulse.unused_triggers.length > 0) {
    const triggers = pulse.unused_triggers.slice(0, 2).join(" и ");
    verdicts.push({
      id: "trust_gap",
      tone: "blue",
      headline: `Никто не использует ${triggers} — первый кто добавит, получит преимущество`,
      detail: `Эти триггеры доверия Cialdini отсутствуют у всех конкурентов. Добавьте один — и вы выделитесь без изменения продукта.`,
    });
  }

  // ── 4. CTA cliché ────────────────────────────────────────────────────────
  if (pulse?.overused_patterns && pulse.overused_patterns.length > 0) {
    verdicts.push({
      id: "cta_cliche",
      tone: "amber",
      headline: `Все используют одинаковые CTA — ваши кнопки теряются`,
      detail: `Шаблонные призывы снижают CTR. Попробуйте глагол, который описывает результат, а не действие: не «Начать», а «Получить анализ».`,
    });
  }

  // ── 5. Promise intensity ─────────────────────────────────────────────────
  const pg = a.promise_gradient;
  if (pg && self && pg.rows.length > 1) {
    const selfRow = pg.rows.find((r) => r.is_self);
    const compIntensities = pg.rows.filter((r) => !r.is_self).map((r) => r.intensity);
    if (selfRow && compIntensities.length > 0) {
      const avgComp = compIntensities.reduce((s, n) => s + n, 0) / compIntensities.length;
      const diff = selfRow.intensity - avgComp;
      if (diff < -15) {
        verdicts.push({
          id: "promise_soft",
          tone: "amber",
          headline: `Ваше обещание мягче, чем у конкурентов — вы звучите осторожнее`,
          detail: `Конкуренты обещают конкретнее и смелее. Не значит врать — значит говорить о результате, а не о процессе. Попробуйте цифру или срок.`,
        });
      } else if (pg.vacuum_zones && pg.vacuum_zones.length > 0) {
        const vz = pg.vacuum_zones[0];
        verdicts.push({
          id: "promise_vacuum",
          tone: "blue",
          headline: `Есть вакуум интенсивности ${vz.from}–${vz.to} — туда никто не заходит`,
          detail: vz.reason,
        });
      }
    }
  }

  // ── 6. Voice USP ─────────────────────────────────────────────────────────
  const vo = a.voice_overlap;
  if (vo?.unique_to_you && vo.unique_to_you.length > 0) {
    verdicts.push({
      id: "voice_usp",
      tone: "green",
      headline: `У вас есть уникальный язык — конкуренты так не говорят`,
      detail: `Слова, которые используете только вы: ${vo.unique_to_you.slice(0, 4).join(", ")}. Это элементы вашего ToV — сохраняйте и усиливайте их в текстах.`,
    });
  }

  // ── Top recommendation ───────────────────────────────────────────────────
  const hasStrategies = !!(
    snapshot.strategies?.defensive ||
    snapshot.strategies?.blind_spot ||
    snapshot.strategies?.new_category
  );

  const redVerdict = verdicts.find((v) => v.tone === "red");
  const amberVerdict = verdicts.find((v) => v.tone === "amber");
  const blueVerdict = verdicts.find((v) => v.tone === "blue");

  let topRecommendation: string;
  if (redVerdict) {
    topRecommendation = redVerdict.headline;
  } else if (hasStrategies) {
    topRecommendation = "AI подготовил 3 стратегии — выберите одну и сгенерируйте оффер";
  } else if (amberVerdict) {
    topRecommendation = amberVerdict.headline;
  } else if (blueVerdict) {
    topRecommendation = blueVerdict.headline;
  } else {
    topRecommendation = "Изучите детали ниже и выберите стратегию роста";
  }

  return { verdicts: verdicts.slice(0, 6), topRecommendation };
}
