import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Loader2, ChevronRight, Wand2 } from "lucide-react";
import { getNextBestAction } from "@/lib/projects/getNextBestAction";
import {
  getProjectActivitySummary,
  getProjectById,
  getProjectEvents,
} from "@/lib/projects/projectApi";
import type { ProjectActivitySummary } from "@/lib/projects/projectApi";
import type { ProjectEvent, ProjectWithContext } from "@/lib/projects/types";
import { ProjectMarketingMap } from "@/components/projects/ProjectMarketingMap";
import { NextBestActionCard } from "@/components/projects/NextBestActionCard";
import { PackagingScoreCard } from "@/components/projects/PackagingScoreCard";
import { ProjectMemoryWidget } from "@/components/projects/ProjectMemoryWidget";
import { MemoryUpdateSuggestions } from "@/components/projects/MemoryUpdateSuggestions";
import { mainGoalLabel } from "@/lib/projects/constants";
import { OnboardingResumeBanner } from "@/components/onboarding/OnboardingResumeBanner";
import { IdeaLabResumeBanner } from "@/components/ideaLab/IdeaLabResumeBanner";
import { EnhancementHistoryCard } from "@/components/onboarding/EnhancementHistoryCard";
import { CommercialMetricsWidget } from "@/components/commercial/CommercialMetricsWidget";
import { ProjectPlanCard } from "@/components/projects/ProjectPlanCard";
import { parseOnboardingState } from "@/lib/onboarding/state";
import { mergeStoredMemoryIntoSections } from "@/lib/projectMemory/mergeSections";
import { getProjectMemoryNextHints } from "@/lib/projectMemory/completion";
import { getProjectMemoryRow, listPendingMemoryUpdates } from "@/lib/projectMemory/api";
import { getProjectPlanBundle } from "@/lib/projects/projectPlanApi";
import type { ProjectPlanBundle } from "@/lib/projects/projectPlanApi";
import type {
  MemoryCompletionLevelSlug,
  ProjectMemorySections,
} from "@/lib/projectMemory/types";
import { listHypothesesForProject } from "@/lib/hypotheses/api";
import { growthCycleHref } from "@/lib/growthCycle/routes";

export default function ProjectDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [data, setData] = useState<ProjectWithContext | null>(null);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [activity, setActivity] = useState<ProjectActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [oldHypothesesCount, setOldHypothesesCount] = useState(0);
  const [activeHypothesesCount, setActiveHypothesesCount] = useState(0);
  const [pendingHypothesesCount, setPendingHypothesesCount] = useState(0);
  const [planBundle, setPlanBundle] = useState<ProjectPlanBundle | null>(null);

  const [memoryBundle, setMemoryBundle] = useState<null | {
    snapshot: ProjectMemorySections;
    completionPercent: number;
    levelSlug: MemoryCompletionLevelSlug | string;
    badges: string[];
    nextHints: string[];
    suggestionRows: Record<string, unknown>[];
  }>(null);

  useEffect(() => {
    if (!projectId) return;
    Promise.all([
      getProjectById(projectId),
      getProjectEvents(projectId, 8),
      getProjectActivitySummary(projectId),
      getProjectMemoryRow(projectId),
      listPendingMemoryUpdates(projectId).catch(() => []),
      listHypothesesForProject(projectId).catch(() => []),
      getProjectPlanBundle(projectId).catch(() => null),
    ])
      .then(([p, ev, act, memRow, sug, hypos, plan]) => {
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
        const oldCount = hypos.filter(
          (h) =>
            h.status === "selected" &&
            Date.now() - new Date(h.created_at).getTime() > SEVEN_DAYS,
        ).length;
        const activeCount = hypos.filter((h) =>
          ["selected", "in_progress", "implemented", "won"].includes(h.status),
        ).length;
        const pendingCount = hypos.filter((h) => h.status === "new").length;
        setActiveHypothesesCount(activeCount);
        setPendingHypothesesCount(pendingCount);
        setOldHypothesesCount(oldCount);
        setData(p);
        setEvents(ev);
        setActivity(act);
        setPlanBundle(plan);
        if (!memRow) {
          setMemoryBundle(null);
          return;
        }
        const snap = mergeStoredMemoryIntoSections(memRow as unknown as Record<string, unknown>);
        const hints = getProjectMemoryNextHints(snap, 5);
        setMemoryBundle({
          snapshot: snap,
          completionPercent: memRow.completion_percent,
          levelSlug: memRow.completion_level ?? "empty",
          badges: memRow.badges ?? [],
          nextHints: hints,
          suggestionRows: (sug as Record<string, unknown>[]) ?? [],
        });
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    if (loading || events.length === 0) return;
    if (window.location.hash !== "#recent-activity") return;
    document.getElementById("recent-activity")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading, events.length]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-destructive text-sm">Проект не найден</p>;
  }

  const { project, context } = data;
  const nba = getNextBestAction(project, context, activity ?? undefined, {
    memoryCompletionPercent: memoryBundle?.completionPercent,
    selectedHypothesesOlderThan7Days: oldHypothesesCount,
    pendingHypothesesFromAudit: pendingHypothesesCount,
  });
  const onboardingState = parseOnboardingState(project.onboarding_state);

  return (
    <div className="space-y-8">
      <OnboardingResumeBanner
        projectId={project.id}
        quizCompleted={project.quiz_completed}
        onboardingCompletedAt={project.onboarding_completed_at}
        state={onboardingState}
      />
      <IdeaLabResumeBanner
        projectId={project.id}
        startupMode={project.startup_mode}
        ideaLabState={project.idea_lab_state}
      />

      <header className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Обзор проекта
        </p>
        <h1
          className="font-display text-3xl font-bold tracking-tight md:text-4xl"
          title={project.name}
        >
          {project.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mainGoalLabel(project.main_goal)}
          {project.current_website_url && (
            <>
              {" · "}
              <a
                href={project.current_website_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {project.current_website_url.replace(/^https?:\/\//, "")}
              </a>
            </>
          )}
        </p>
      </header>

      <NextBestActionCard action={nba} />

      {planBundle && (
        <ProjectPlanCard
          projectId={project.id}
          defaultGoal={mainGoalLabel(project.main_goal)}
          metrics={planBundle.metrics}
          plan={planBundle.plan}
          tableAvailable={planBundle.tableAvailable}
          onPlanChanged={(plan) =>
            setPlanBundle((prev) =>
              prev
                ? {
                    ...prev,
                    plan,
                    northStarMetric:
                      prev.metrics.find((m) => m.id === plan.north_star_metric_id) ??
                      prev.northStarMetric,
                  }
                : prev,
            )
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProjectMarketingMap
            project={project}
            context={context}
            memory={memoryBundle?.snapshot}
          />
        </div>
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          {memoryBundle && (
            <ProjectMemoryWidget
              projectId={project.id}
              completionPercent={memoryBundle.completionPercent}
              levelSlug={memoryBundle.levelSlug}
              snapshot={memoryBundle.snapshot}
              badges={memoryBundle.badges}
              nextHints={memoryBundle.nextHints}
              quizBaseline={Boolean(project.quiz_completed)}
            />
          )}
          <PackagingScoreCard score={project.packaging_score} />
          <CommercialMetricsWidget projectId={project.id} />
        </aside>
      </div>

      <MemoryUpdateSuggestions
        suggestions={memoryBundle?.suggestionRows ?? []}
        projectId={project.id}
        onApplied={(next) => {
          const hints = getProjectMemoryNextHints(next.snapshot, 5);
          setMemoryBundle((prev) => {
            if (prev) {
              return {
                ...prev,
                completionPercent: next.completionPercent,
                levelSlug: next.level,
                snapshot: next.snapshot,
                badges: next.badges,
                nextHints: hints,
              };
            }
            return {
              snapshot: next.snapshot,
              completionPercent: next.completionPercent,
              levelSlug: next.level,
              badges: next.badges,
              nextHints: hints,
              suggestionRows: [],
            };
          });
        }}
      />

      {(activeHypothesesCount > 0 || pendingHypothesesCount > 0) && (
        <Link
          to={growthCycleHref(project.id)}
          className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/[0.03] px-5 py-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.06]"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Wand2 className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold">Цикл внедрения</p>
              <p className="text-xs text-muted-foreground">
                {pendingHypothesesCount > 0
                  ? `${pendingHypothesesCount} ${pendingHypothesesCount === 1 ? "рекомендация" : pendingHypothesesCount < 5 ? "рекомендации" : "рекомендаций"} из аудита — выберите, что внедрять`
                  : `${activeHypothesesCount} ${activeHypothesesCount === 1 ? "гипотеза" : activeHypothesesCount < 5 ? "гипотезы" : "гипотез"} в работе${oldHypothesesCount > 0 ? " · пора зафиксировать результат" : ""}`}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      )}

      <div id="recent-activity" className="scroll-mt-24">
        <EnhancementHistoryCard projectId={project.id} events={events} />
      </div>
    </div>
  );
}
