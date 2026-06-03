import type { ReactNode } from "react";
import type { NicheSnapshot } from "@/lib/competitors/types";
import { deriveNicheInsights } from "@/lib/competitors/deriveNicheInsights";
import { NicheExecutiveSummary } from "./NicheExecutiveSummary";
import { NicheStrategiesPanel } from "./NicheStrategiesPanel";
import { InsightCallout } from "./InsightCallout";
import { PositioningMap } from "./PositioningMap";
import { NicheScorecard } from "./NicheScorecard";
import { FirstScreenWall } from "./FirstScreenWall";
import { NichePulseCard } from "./NichePulseCard";
import { TrustMatrix } from "./TrustMatrix";
import { CtaInventory } from "./CtaInventory";
import { PricingIntelligence } from "./PricingIntelligence";
import { VoiceOverlap } from "./VoiceOverlap";
import { AwarenessCoverage } from "./AwarenessCoverage";
import { PromiseGradient } from "./PromiseGradient";
import { NicheComparisonTable } from "./NicheComparisonTable";
import { StaleComparisonTableBanner } from "./StaleComparisonTableBanner";
import {
  isIntelComparisonTable,
  isStaleComparisonTable,
} from "@/lib/competitors/comparisonTable";

type Props = {
  snapshot: NicheSnapshot;
  footer?: ReactNode;
  /** Passed through to strategy cards for offer-generator links. */
  projectId?: string;
  /** Пересборка карты (для баннера устаревшей таблицы). */
  onRebuildTable?: () => void;
  rebuildingTable?: boolean;
};

/**
 * Insight-first niche snapshot layout.
 * Order: summary verdicts → strategies → supporting charts (collapsed by default on mobile).
 */
export function NicheSnapshotDashboard({
  snapshot,
  footer,
  projectId,
  onRebuildTable,
  rebuildingTable,
}: Props) {
  const a = snapshot.artifacts;
  if (!a?.positioning_map) return null;

  const insights = deriveNicheInsights(snapshot);

  /* Derive per-widget verdict lines from insights */
  const posVerdict = insights.verdicts.find(
    (v) => v.id === "positioning_crowded" || v.id === "positioning_ok",
  );
  const scorecardVerdict = insights.verdicts.find(
    (v) => v.id === "hormozi_strong" || v.id === "hormozi_avg" || v.id === "hormozi_weak",
  );
  const trustVerdict = insights.verdicts.find((v) => v.id === "trust_gap");
  const ctaVerdict = insights.verdicts.find((v) => v.id === "cta_cliche");
  const promiseVerdict = insights.verdicts.find(
    (v) => v.id === "promise_soft" || v.id === "promise_vacuum",
  );
  const voiceVerdict = insights.verdicts.find((v) => v.id === "voice_usp");
  const emptyZonesVerdict = insights.verdicts.find((v) => v.id === "empty_zones");

  const hasStrategies = !!(
    snapshot.strategies?.defensive ||
    snapshot.strategies?.blind_spot ||
    snapshot.strategies?.new_category
  );

  return (
    <div className="space-y-10">
      {/* ── 1. Executive summary — verdicts in plain language ── */}
      <NicheExecutiveSummary insights={insights} generatedAt={snapshot.generated_at} />

      {/* ── 2. Таблица конкурентной разведки (PDF-шаблон) ── */}
      {isStaleComparisonTable(a.comparison_table) && projectId && onRebuildTable ? (
        <StaleComparisonTableBanner
          projectId={projectId}
          building={!!rebuildingTable}
          onRebuild={onRebuildTable}
        />
      ) : isIntelComparisonTable(a.comparison_table) ? (
        <NicheComparisonTable data={a.comparison_table!} />
      ) : (
        <p className="rounded-xl border border-dashed border-border/60 bg-card/30 px-4 py-3 text-sm text-muted-foreground">
          Таблица разведки появится после пересборки карты. Сначала заново проанализируйте конкурентов — так
          подтянутся 11 критериев из шаблона (выручка, продукт, воронка, MarTech и т.д.).
        </p>
      )}

      {/* ── 3. Strategies ── */}
      {hasStrategies && <NicheStrategiesPanel strategies={snapshot.strategies} projectId={projectId} />}

      {/* ── 4. Supporting evidence (charts) ── */}
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Подтверждающие данные
        </p>
        <p className="text-sm text-muted-foreground">
          Ниже — цифры, из которых сделаны выводы выше. Просматривайте по желанию.
        </p>
      </div>

      <div className="space-y-6">
        {/* Positioning map */}
        <InsightCallout
          verdict={
            posVerdict?.headline ??
            "Карта показывает, на каком уровне осознания и сложности рынка находится каждый игрок."
          }
        >
          <PositioningMap data={a.positioning_map} />
        </InsightCallout>

        {/* Awareness coverage */}
        {a.awareness_coverage && (
          <InsightCallout
            verdict={
              emptyZonesVerdict?.headline ??
              "Покрытие awareness: кто из игроков работает с каким уровнем аудитории."
            }
          >
            <AwarenessCoverage data={a.awareness_coverage} />
          </InsightCallout>
        )}

        {/* Scorecard */}
        {a.scorecard && (
          <InsightCallout
            verdict={
              scorecardVerdict?.headline ??
              "Сравнение ценностного предложения по осям Hormozi Value Equation."
            }
          >
            <NicheScorecard data={a.scorecard} />
          </InsightCallout>
        )}

        {/* First-screen wall */}
        {a.first_screen_wall && (
          <InsightCallout
            verdict="Что видит посетитель на первом экране у каждого игрока — до того, как прокрутит."
          >
            <FirstScreenWall data={a.first_screen_wall} />
          </InsightCallout>
        )}

        {/* Trust matrix */}
        {a.trust_matrix && (
          <InsightCallout
            verdict={trustVerdict?.headline ?? "Триггеры доверия Cialdini × 6 по каждому игроку."}
          >
            <TrustMatrix data={a.trust_matrix} />
          </InsightCallout>
        )}

        {/* CTA inventory */}
        {a.cta_inventory && (
          <InsightCallout
            verdict={ctaVerdict?.headline ?? "Призывы к действию на первом экране у каждого игрока."}
          >
            <CtaInventory data={a.cta_inventory} />
          </InsightCallout>
        )}

        {/* Niche Pulse */}
        {a.niche_pulse && (
          <InsightCallout
            verdict="6 агрегированных метрик ниши — быстрый срез рекламной экосистемы."
          >
            <NichePulseCard data={a.niche_pulse} />
          </InsightCallout>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Pricing */}
          {a.pricing_intelligence && (
            <InsightCallout verdict="Где вы на ценовой лестнице ниши.">
              <PricingIntelligence data={a.pricing_intelligence} />
            </InsightCallout>
          )}

          {/* Voice overlap */}
          {a.voice_overlap && (
            <InsightCallout
              verdict={
                voiceVerdict?.headline ?? "Пересечение вашего языка с языком рынка."
              }
            >
              <VoiceOverlap data={a.voice_overlap} />
            </InsightCallout>
          )}
        </div>

        {/* Promise gradient */}
        {a.promise_gradient && (
          <InsightCallout
            verdict={
              promiseVerdict?.headline ??
              "Жёсткость обещания: насколько смело каждый игрок заявляет о результате."
            }
          >
            <PromiseGradient data={a.promise_gradient} />
          </InsightCallout>
        )}
      </div>

      {footer}
    </div>
  );
}

export function nicheSharePath(shareId: string): string {
  return `/r/${shareId}/niche-snapshot`;
}

export function nicheShareAbsoluteUrl(shareId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}${nicheSharePath(shareId)}`;
  }
  return `https://pishalking.ru${nicheSharePath(shareId)}`;
}
