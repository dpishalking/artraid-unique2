import type {
  CompetitorAudit,
  CompetitorAuditStatus,
  CompetitorProfile,
  CompetitorScores,
  CompetitorSource,
  CompetitorStatus,
  NicheSnapshot,
  NicheSnapshotArtifacts,
  NicheSnapshotStatus,
  NicheSnapshotStrategies,
  YourLensPayload,
} from "./types";

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

function asPlainObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

const VALID_SOURCES: CompetitorSource[] = [
  "manual",
  "auto_context",
  "auto_lookalike",
  "auto_serp",
  "auto_extracted",
];

const VALID_STATUSES: CompetitorStatus[] = [
  "queued",
  "analyzing",
  "analyzed",
  "failed",
  "archived",
];

function parseSource(v: unknown): CompetitorSource {
  const s = String(v ?? "manual");
  return (VALID_SOURCES as string[]).includes(s) ? (s as CompetitorSource) : "manual";
}

function parseStatus(v: unknown): CompetitorStatus {
  const s = String(v ?? "queued");
  return (VALID_STATUSES as string[]).includes(s) ? (s as CompetitorStatus) : "queued";
}

export function normalizeCompetitorProfile(row: Record<string, unknown>): CompetitorProfile {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    url: String(row.url),
    host: String(row.host),
    name: row.name ? String(row.name) : null,
    source: parseSource(row.source),
    status: parseStatus(row.status),
    confidence: typeof row.confidence === "number" ? row.confidence : null,
    ai_reason: row.ai_reason ? String(row.ai_reason) : null,
    screenshot_url: row.screenshot_url ? String(row.screenshot_url) : null,
    tags: asStringArray(row.tags),
    notes: row.notes ? String(row.notes) : null,
    is_self: row.is_self === true,
    latest_audit_id: row.latest_audit_id ? String(row.latest_audit_id) : null,
    scan_interval_days:
      typeof row.scan_interval_days === "number" ? row.scan_interval_days : 7,
    discovered_at: String(row.discovered_at ?? row.created_at ?? new Date().toISOString()),
    last_scanned_at: row.last_scanned_at ? String(row.last_scanned_at) : null,
    failure_reason: row.failure_reason ? String(row.failure_reason) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

const VALID_AUDIT_STATUSES: CompetitorAuditStatus[] = [
  "pending",
  "running",
  "completed",
  "failed",
];

function parseAuditStatus(v: unknown): CompetitorAuditStatus {
  const s = String(v ?? "pending");
  return (VALID_AUDIT_STATUSES as string[]).includes(s) ? (s as CompetitorAuditStatus) : "pending";
}

function parseScores(v: unknown): CompetitorScores {
  const o = asPlainObject(v);
  const out: CompetitorScores = {};
  if (typeof o.hormozi === "number") out.hormozi = o.hormozi;
  if (typeof o.meclabs === "number") out.meclabs = o.meclabs;
  if (typeof o.eisenberg === "number") out.eisenberg = o.eisenberg;
  if (typeof o.storybrand === "number") out.storybrand = o.storybrand;
  if (typeof o.trust_coverage === "number") out.trust_coverage = o.trust_coverage;
  if (
    typeof o.awareness === "string" &&
    ["unaware", "problem", "solution", "product", "most"].includes(o.awareness)
  ) {
    out.awareness = o.awareness as CompetitorScores["awareness"];
  }
  if (typeof o.sophistication === "number" && o.sophistication >= 1 && o.sophistication <= 5) {
    out.sophistication = Math.round(o.sophistication) as CompetitorScores["sophistication"];
  }
  return out;
}

function parseYourLens(v: unknown): YourLensPayload | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const out: YourLensPayload = {};
  if (typeof o.hooks_for_your_icp === "string") out.hooks_for_your_icp = o.hooks_for_your_icp;
  if (typeof o.repels_your_icp === "string") out.repels_your_icp = o.repels_your_icp;
  if (Array.isArray(o.we_are_better)) out.we_are_better = asStringArray(o.we_are_better);
  if (Array.isArray(o.we_are_worse)) out.we_are_worse = asStringArray(o.we_are_worse);
  if (Array.isArray(o.stealable_ideas)) out.stealable_ideas = asStringArray(o.stealable_ideas);
  if (Array.isArray(o.forbidden_moves)) out.forbidden_moves = asStringArray(o.forbidden_moves);
  if (typeof o.positioning_role === "string") {
    out.positioning_role = o.positioning_role as YourLensPayload["positioning_role"];
  }
  return out;
}

export function normalizeCompetitorAudit(row: Record<string, unknown>): CompetitorAudit {
  return {
    id: String(row.id),
    competitor_id: String(row.competitor_id),
    project_id: String(row.project_id),
    run_no: typeof row.run_no === "number" ? row.run_no : 1,
    status: parseAuditStatus(row.status),
    audit_payload: row.audit_payload ? asPlainObject(row.audit_payload) : null,
    your_lens_payload: parseYourLens(row.your_lens_payload),
    scores: parseScores(row.scores),
    extracted_price: row.extracted_price ? String(row.extracted_price) : null,
    first_screen_image_url: row.first_screen_image_url ? String(row.first_screen_image_url) : null,
    page_snapshot_hash: row.page_snapshot_hash ? String(row.page_snapshot_hash) : null,
    error: row.error ? String(row.error) : null,
    model_meta: asPlainObject(row.model_meta),
    started_at: String(row.started_at ?? row.created_at ?? new Date().toISOString()),
    finished_at: row.finished_at ? String(row.finished_at) : null,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

const VALID_SNAPSHOT_STATUSES: NicheSnapshotStatus[] = [
  "pending",
  "building",
  "completed",
  "failed",
];

function parseSnapshotStatus(v: unknown): NicheSnapshotStatus {
  const s = String(v ?? "pending");
  return (VALID_SNAPSHOT_STATUSES as string[]).includes(s)
    ? (s as NicheSnapshotStatus)
    : "pending";
}

function parseIncludedIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter(Boolean);
}

export function normalizeNicheSnapshot(row: Record<string, unknown>): NicheSnapshot {
  return {
    id: String(row.id),
    project_id: String(row.project_id),
    your_audit_id: row.your_audit_id ? String(row.your_audit_id) : null,
    included_competitor_ids: parseIncludedIds(row.included_competitor_ids),
    status: parseSnapshotStatus(row.status),
    artifacts: asPlainObject(row.artifacts) as NicheSnapshotArtifacts,
    strategies: asPlainObject(row.strategies) as NicheSnapshotStrategies,
    share_id: row.share_id ? String(row.share_id) : null,
    error: row.error ? String(row.error) : null,
    model_meta: asPlainObject(row.model_meta),
    generated_at: String(row.generated_at ?? row.created_at ?? new Date().toISOString()),
    created_at: String(row.created_at ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? row.created_at ?? new Date().toISOString()),
  };
}

/**
 * Извлекает host из URL, нормализуя для дедупа в `competitor_profiles.host`.
 * Лоуэркейсит, отбрасывает www., убирает trailing slash. Возвращает null, если URL невалиден.
 */
export function extractHost(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withProtocol);
    return u.hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}
