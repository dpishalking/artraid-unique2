/** Maps raw audit JSON → project_insights, hypotheses, context patch, packaging score. */

export type MappedInsight = {
  source_type: string;
  source_id: string | null;
  insight_type: string;
  title: string;
  description: string | null;
  evidence: string | null;
  confidence: "low" | "medium" | "high";
};

export type MappedHypothesis = {
  source_type: string;
  source_generation_id: string | null;
  title: string;
  description: string | null;
  type: string;
  priority: "high" | "medium" | "low";
  what_to_change: string | null;
  why: string | null;
  expected_impact: string | null;
};

function str(v: unknown, max = 2000): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

function packagingFromAudit(audit: Record<string, unknown>): number | null {
  const offer = (audit.offerScore as Record<string, unknown> | undefined)?.totalScore;
  const meclabs = (audit.meclabsScore as Record<string, unknown> | undefined)?.score;
  const vals: number[] = [];
  for (const n of [offer, meclabs]) {
    if (typeof n !== "number" || !Number.isFinite(n)) continue;
    vals.push(n <= 10 ? Math.round(n * 10) : Math.round(n));
  }
  if (!vals.length) return null;
  return Math.min(100, Math.max(0, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)));
}

export function mapAuditToProjectData(
  auditRaw: unknown,
  analysisLogId: string,
): {
  insights: MappedInsight[];
  hypotheses: MappedHypothesis[];
  contextPatch: Record<string, unknown>;
  packagingScore: number | null;
} {
  const audit = (auditRaw && typeof auditRaw === "object" ? auditRaw : {}) as Record<string, unknown>;
  const insights: MappedInsight[] = [];
  const hypotheses: MappedHypothesis[] = [];

  const diagnosis = (audit.diagnosis && typeof audit.diagnosis === "object"
    ? audit.diagnosis
    : {}) as Record<string, unknown>;

  const mainProblem = str(diagnosis.mainProblem);
  if (mainProblem) {
    insights.push({
      source_type: "website_audit",
      source_id: analysisLogId,
      insight_type: "diagnosis",
      title: "Главная проблема упаковки",
      description: mainProblem,
      evidence: str(diagnosis.rootCause),
      confidence: "high",
    });
  }

  const quickest = (audit.quickestWin && typeof audit.quickestWin === "object"
    ? audit.quickestWin
    : null) as Record<string, unknown> | null;
  const qwTitle = str(quickest?.title ?? quickest?.action);
  if (qwTitle) {
    hypotheses.push({
      source_type: "website_audit",
      source_generation_id: null,
      title: qwTitle,
      description: str(quickest?.description ?? quickest?.why),
      type: "conversion",
      priority: "high",
      what_to_change: str(quickest?.action ?? quickest?.title),
      why: str(quickest?.why ?? quickest?.impact),
      expected_impact: str(quickest?.impact),
    });
  }

  const problems = Array.isArray(audit.problems) ? audit.problems : [];
  for (const p of problems.slice(0, 8)) {
    if (!p || typeof p !== "object") continue;
    const row = p as Record<string, unknown>;
    const title = str(row.title ?? row.problem ?? row.name);
    if (!title) continue;
    const sev = String(row.severity ?? "").toLowerCase();
    const priority: MappedHypothesis["priority"] =
      sev.includes("crit") || sev.includes("крит") ? "high" : "medium";
    hypotheses.push({
      source_type: "website_audit",
      source_generation_id: null,
      title,
      description: str(row.description ?? row.detail),
      type: "packaging",
      priority,
      what_to_change: str(row.fix ?? row.recommendation),
      why: str(row.why ?? row.impact),
      expected_impact: str(row.impact),
    });
  }

  const roadmapRaw = audit.roadmap;
  const roadmapItems: Record<string, unknown>[] = [];
  if (Array.isArray(roadmapRaw)) {
    for (const step of roadmapRaw) {
      if (step && typeof step === "object") roadmapItems.push(step as Record<string, unknown>);
    }
  } else if (roadmapRaw && typeof roadmapRaw === "object") {
    const rm = roadmapRaw as Record<string, unknown>;
    for (const key of ["quickWins", "thisWeek", "thisMonth"]) {
      const arr = rm[key];
      if (!Array.isArray(arr)) continue;
      for (const step of arr) {
        if (step && typeof step === "object") roadmapItems.push(step as Record<string, unknown>);
      }
    }
  }
  for (const row of roadmapItems.slice(0, 8)) {
    const title = str(row.title ?? row.step ?? row.action);
    if (!title) continue;
    hypotheses.push({
      source_type: "website_audit",
      source_generation_id: null,
      title,
      description: str(row.description),
      type: "offer",
      priority: "high",
      what_to_change: title,
      why: str(row.why),
      expected_impact: str(row.expectedEffect ?? row.impact),
    });
  }

  const contextPatch: Record<string, unknown> = {};
  const market = (audit.marketContext && typeof audit.marketContext === "object"
    ? audit.marketContext
    : null) as Record<string, unknown> | null;
  const category = str(market?.category ?? market?.niche);
  if (category) contextPatch.market_category = category;

  const sophistication = str(market?.sophisticationComment);
  if (sophistication) contextPatch.important_notes = sophistication;

  return {
    insights,
    hypotheses,
    contextPatch,
    packagingScore: packagingFromAudit(audit),
  };
}
