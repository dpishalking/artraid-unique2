import { supabase } from "@/integrations/supabase/client";
import type { HypothesisStatus } from "@/lib/hypotheses/api";

export type CabinetAggregateStats = {
  projectCount: number;
  auditsDone: number;
  prototypesTotal: number;
  hypothesesTotal: number;
  hypothesesTested: number;
  hypothesesActive: number;
  hypothesesWon: number;
  avgMemoryPct: number;
};

const TESTED_STATUSES = new Set<HypothesisStatus>([
  "implemented",
  "tested",
  "won",
  "lost",
  "rejected",
]);

const ACTIVE_STATUSES = new Set<HypothesisStatus>(["selected", "in_progress"]);

export async function fetchCabinetAggregateStats(
  projectIds: string[],
): Promise<CabinetAggregateStats> {
  const empty: CabinetAggregateStats = {
    projectCount: projectIds.length,
    auditsDone: 0,
    prototypesTotal: 0,
    hypothesesTotal: 0,
    hypothesesTested: 0,
    hypothesesActive: 0,
    hypothesesWon: 0,
    avgMemoryPct: 0,
  };

  if (!projectIds.length) return empty;

  const [memRes, hypRes, auditRes, protoRes] = await Promise.all([
    supabase
      .from("project_memories")
      .select("completion_percent")
      .in("project_id", projectIds),
    supabase.from("hypotheses").select("status").in("project_id", projectIds),
    supabase
      .from("project_events")
      .select("project_id")
      .in("project_id", projectIds)
      .eq("event_type", "audit_completed"),
    supabase.from("prototypes").select("id").in("project_id", projectIds),
  ]);

  const memRows = (memRes.data ?? []) as { completion_percent: number | null }[];
  const memValues = memRows
    .map((r) => (typeof r.completion_percent === "number" ? r.completion_percent : 0))
    .filter((v) => v >= 0);
  const avgMemoryPct =
    memValues.length > 0
      ? Math.round(memValues.reduce((a, b) => a + b, 0) / memValues.length)
      : 0;

  const hypRows = (hypRes.data ?? []) as { status: HypothesisStatus }[];
  let hypothesesTested = 0;
  let hypothesesActive = 0;
  let hypothesesWon = 0;
  for (const row of hypRows) {
    if (TESTED_STATUSES.has(row.status)) hypothesesTested += 1;
    if (ACTIVE_STATUSES.has(row.status)) hypothesesActive += 1;
    if (row.status === "won") hypothesesWon += 1;
  }

  const auditProjects = new Set(
    ((auditRes.data ?? []) as { project_id: string }[]).map((r) => r.project_id),
  );

  return {
    projectCount: projectIds.length,
    auditsDone: auditProjects.size,
    prototypesTotal: (protoRes.data ?? []).length,
    hypothesesTotal: hypRows.length,
    hypothesesTested,
    hypothesesActive,
    hypothesesWon,
    avgMemoryPct,
  };
}
