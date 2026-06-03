/**
 * Типы сущностей конкурентной разведки.
 * Соответствуют миграции `20260716120000_competitor_intelligence.sql`.
 */

export type CompetitorSource =
  | "manual"
  | "auto_context"
  | "auto_lookalike"
  | "auto_serp"
  | "auto_extracted";

export type CompetitorStatus =
  | "queued"
  | "analyzing"
  | "analyzed"
  | "failed"
  | "archived";

export type CompetitorProfile = {
  id: string;
  project_id: string;
  url: string;
  host: string;
  name: string | null;
  source: CompetitorSource;
  status: CompetitorStatus;
  confidence: number | null;
  ai_reason: string | null;
  screenshot_url: string | null;
  tags: string[];
  notes: string | null;
  is_self: boolean;
  latest_audit_id: string | null;
  scan_interval_days: number;
  discovered_at: string;
  last_scanned_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type CompetitorAuditStatus = "pending" | "running" | "completed" | "failed";

/** Лёгкие скоринги конкурента — попадают в карточки и виджеты сравнения без распаковки audit_payload. */
export type CompetitorScores = {
  hormozi?: number;
  meclabs?: number;
  eisenberg?: number;
  storybrand?: number;
  awareness?: "unaware" | "problem" | "solution" | "product" | "most";
  sophistication?: 1 | 2 | 3 | 4 | 5;
  trust_coverage?: number;
};

export type CompetitorAudit = {
  id: string;
  competitor_id: string;
  project_id: string;
  run_no: number;
  status: CompetitorAuditStatus;
  audit_payload: Record<string, unknown> | null;
  your_lens_payload: YourLensPayload | null;
  scores: CompetitorScores;
  extracted_price: string | null;
  first_screen_image_url: string | null;
  page_snapshot_hash: string | null;
  error: string | null;
  model_meta: Record<string, unknown>;
  started_at: string;
  finished_at: string | null;
  created_at: string;
};

/** Результат второго прохода — конкурент глазами клиента вашего проекта. */
export type YourLensPayload = {
  /** Чем зацепит вашу ICP? */
  hooks_for_your_icp?: string;
  /** Чем оттолкнёт вашу ICP? */
  repels_your_icp?: string;
  /** Чем мы лучше? */
  we_are_better?: string[];
  /** Чем мы хуже? */
  we_are_worse?: string[];
  /** Что можно адаптировать к нашему ToV? */
  stealable_ideas?: string[];
  /** Что нельзя повторять (рынок устал)? */
  forbidden_moves?: string[];
  /** Позиционная роль на рынке. */
  positioning_role?:
    | "price_leader"
    | "premium"
    | "niche_expert"
    | "generalist"
    | "mechanism_led"
    | "category_creator";
};

export type NicheSnapshotStatus = "pending" | "building" | "completed" | "failed";

/**
 * Готовые виджеты в `niche_snapshots.artifacts`. Каждое поле может отсутствовать,
 * если данных не хватило (фронт умеет рендерить только то, что есть).
 */
export type ComparisonTableCell = {
  display: string;
  /** Число для сравнения с медианой (если применимо). */
  numeric: number | null;
  /** Подсветка относительно ниши. */
  tone?: "good" | "warn" | "neutral";
};

export type ComparisonTableColumn = {
  id: string;
  label: string;
  is_self: boolean;
  url?: string | null;
};

export type ComparisonTableRow = {
  id: string;
  label: string;
  short_label: string;
  group: string;
  format: "score" | "scale" | "text" | "percent" | "count";
  cells: ComparisonTableCell[];
  /** Медиана по конкурентам (без «вы»), только для числовых строк. */
  niche_median: string | null;
  niche_top: string | null;
};

/** Сводная таблица конкурентной разведки (шаблон PDF). */
export type ComparisonTableArtifact = {
  columns: ComparisonTableColumn[];
  rows: ComparisonTableRow[];
  indicator_count: number;
  /** Число критериев разведки (без строки «Сайт» и краткого сравнения). */
  intel_criteria_count?: number;
  site_count: number;
  template?: "competitive_intel_pdf";
};

export type NicheSnapshotArtifacts = {
  comparison_table?: ComparisonTableArtifact;
  positioning_map?: PositioningMapArtifact;
  scorecard?: ScorecardArtifact;
  niche_pulse?: NichePulseArtifact;
  first_screen_wall?: FirstScreenWallArtifact;
  trust_matrix?: TrustMatrixArtifact;
  cta_inventory?: CtaInventoryArtifact;
  pricing_intelligence?: PricingIntelligenceArtifact;
  voice_overlap?: VoiceOverlapArtifact;
  awareness_coverage?: AwarenessCoverageArtifact;
  promise_gradient?: PromiseGradientArtifact;
};

export type PositioningMapPoint = {
  competitor_id: string;
  label: string;
  /** Awareness Schwartz: unaware → most. */
  awareness: "unaware" | "problem" | "solution" | "product" | "most";
  /** Sophistication 1–5. */
  sophistication: 1 | 2 | 3 | 4 | 5;
  is_self: boolean;
};

export type PositioningMapArtifact = {
  points: PositioningMapPoint[];
  /** Координаты пустых сегментов (для подсветки blind-spots на карте). */
  empty_zones?: string[];
};

export type ScorecardArtifact = {
  framework: "hormozi" | "meclabs" | "eisenberg" | "storybrand";
  axes: string[];
  you: number[];
  median: number[];
  top: number[];
  commentary?: string;
};

export type NichePulseArtifact = {
  avg_hormozi: number | null;
  share_with_guarantee_pct: number | null;
  dominant_awareness: PositioningMapPoint["awareness"] | null;
  avg_cta_count: number | null;
  top_cta_verb: string | null;
  top_speed_promise: string | null;
  /** Триггеры доверия Cialdini × 6, которые НЕ используются ни одним конкурентом. */
  unused_triggers: string[];
  /** Триггеры/фразы, которые встречаются у ≥70% конкурентов (cliché). */
  overused_patterns: string[];
};

export type FirstScreenWallRow = {
  competitor_id: string;
  label: string;
  headline: string | null;
  sub_headline: string | null;
  primary_cta: string | null;
  trust_count: number;
  awareness_target: PositioningMapPoint["awareness"] | null;
  is_self: boolean;
};

export type FirstScreenWallArtifact = {
  rows: FirstScreenWallRow[];
};

export type TrustMatrixCell = "strong" | "weak" | "none";

export type TrustMatrixArtifact = {
  triggers: string[];
  /** Каждая строка — конкурент, каждая колонка — триггер из triggers. */
  rows: Array<{
    competitor_id: string;
    label: string;
    is_self: boolean;
    cells: TrustMatrixCell[];
    coverage_pct?: number;
  }>;
};

export type CtaInventoryArtifact = {
  items: Array<{
    competitor_id: string;
    label: string;
    cta_text: string;
    verb: string | null;
    scroll_position: "first_screen" | "middle" | "footer";
    is_self: boolean;
  }>;
  cliche_verbs: string[];
  unique_to_you: string[];
};

export type PricingIntelligenceArtifact = {
  rows: Array<{
    competitor_id: string;
    label: string;
    extracted_price: string | null;
    pricing_model:
      | "one_off"
      | "subscription"
      | "packages"
      | "freemium"
      | "on_request"
      | null;
    is_self: boolean;
  }>;
  median_price_label: string | null;
  ladder_position: "below_median" | "at_median" | "above_median" | "unknown";
};

export type VoiceOverlapArtifact = {
  /** Что используется у большинства и есть у вас. */
  shared: string[];
  /** Что используется у конкурентов, но не у вас (stealable). */
  stealable: string[];
  /** Что используется только у вас (USP в языке). */
  unique_to_you: string[];
  /** Затёртые формулировки рынка. */
  cliche: string[];
};

export type AwarenessCoverageArtifact = {
  segments: Array<{
    level: PositioningMapPoint["awareness"];
    competitor_ids: string[];
    is_empty: boolean;
  }>;
};

export type PromiseGradientArtifact = {
  rows: Array<{
    competitor_id: string;
    label: string;
    /** 0 = мягкое («помогаем разобраться»), 100 = жёсткое («+200% к конверсии за 30 дней»). */
    intensity: number;
    promise: string;
    is_self: boolean;
  }>;
  vacuum_zones: Array<{ from: number; to: number; reason: string }>;
};

/** Три готовые стратегии в `niche_snapshots.strategies`. */
export type NicheStrategyKind = "defensive" | "blind_spot" | "new_category";

export type NicheStrategy = {
  kind: NicheStrategyKind;
  title: string;
  rationale: string;
  what_to_change: string[];
  draft_offer?: {
    headline: string;
    sub_headline?: string;
    promise: string;
    cta: string;
    proof: string[];
  };
  draft_prototype_id?: string;
};

export type NicheSnapshotStrategies = {
  defensive?: NicheStrategy;
  blind_spot?: NicheStrategy;
  new_category?: NicheStrategy;
};

export type NicheSnapshot = {
  id: string;
  project_id: string;
  your_audit_id: string | null;
  included_competitor_ids: string[];
  status: NicheSnapshotStatus;
  artifacts: NicheSnapshotArtifacts;
  strategies: NicheSnapshotStrategies;
  share_id: string | null;
  error: string | null;
  model_meta: Record<string, unknown>;
  generated_at: string;
  created_at: string;
  updated_at: string;
};

/** Кандидат, найденный discovery-функцией, ещё не сохранённый в БД. */
export type CompetitorCandidate = {
  url: string;
  host: string;
  name: string | null;
  source: CompetitorSource;
  confidence: number;
  ai_reason: string;
  /** Для preview в карточке-кандидате: что AI узнал по beats / тегам. */
  preview_tags?: string[];
};
