-- Конкурентная разведка: профили конкурентов, их аудиты и niche-snapshot.
-- Не трогаем существующие сущности (projects.competitors, project_memories.competitors)
-- — они остаются "лёгкими" записями (bookmarks). Под аналитику добавляем отдельный слой.

-- ─── 1. competitor_profiles ──────────────────────────────────────────────────
create table if not exists public.competitor_profiles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,

  url text not null,
  host text not null,
  name text,

  source text not null
    check (source in ('manual', 'auto_context', 'auto_lookalike', 'auto_serp', 'auto_extracted')),
  status text not null default 'queued'
    check (status in ('queued', 'analyzing', 'analyzed', 'failed', 'archived')),

  -- Для авто-источников: насколько AI уверен, что это реально конкурент.
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  -- Короткое обоснование от AI (только для авто-источников)
  ai_reason text,

  screenshot_url text,
  tags jsonb not null default '[]'::jsonb,
  notes text,

  -- Сайт самого пользователя (для удобства side-by-side: ваш сайт = одна из карточек).
  is_self boolean not null default false,

  -- Денорм для UI: id последнего аудита (без FK, чтобы избежать цикла с competitor_audits).
  latest_audit_id uuid,

  scan_interval_days integer not null default 7
    check (scan_interval_days >= 1 and scan_interval_days <= 90),

  discovered_at timestamptz not null default now(),
  last_scanned_at timestamptz,
  failure_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (project_id, host)
);

create index if not exists idx_competitor_profiles_project
  on public.competitor_profiles (project_id, status, last_scanned_at desc);

create index if not exists idx_competitor_profiles_host
  on public.competitor_profiles (host);

-- ─── 2. competitor_audits ────────────────────────────────────────────────────
create table if not exists public.competitor_audits (
  id uuid primary key default gen_random_uuid(),
  competitor_id uuid not null references public.competitor_profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,

  run_no integer not null default 1,
  status text not null default 'pending'
    check (status in ('pending', 'running', 'completed', 'failed')),

  -- Проход 1: универсальный аудит (та же форма, что и analysis_logs.audit).
  audit_payload jsonb,
  -- Проход 2: "вашими очками" — релевантно для вашего проекта.
  your_lens_payload jsonb,

  -- Сжатые скоринги для быстрых выборок и сравнений без распаковки audit_payload.
  scores jsonb not null default '{}'::jsonb,

  extracted_price text,
  first_screen_image_url text,
  page_snapshot_hash text,

  error text,
  model_meta jsonb not null default '{}'::jsonb,

  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_competitor_audits_competitor
  on public.competitor_audits (competitor_id, run_no desc);

create index if not exists idx_competitor_audits_project
  on public.competitor_audits (project_id, created_at desc);

-- ─── 3. niche_snapshots ──────────────────────────────────────────────────────
create table if not exists public.niche_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,

  -- Аудит сайта самого пользователя (из analysis_logs).
  your_audit_id uuid references public.analysis_logs (id) on delete set null,
  -- Конкретные конкуренты, попавшие в этот снимок (порядок важен для виджетов).
  included_competitor_ids jsonb not null default '[]'::jsonb,

  status text not null default 'pending'
    check (status in ('pending', 'building', 'completed', 'failed')),

  -- 10 виджетов в готовом для рендера виде (positioning_map, scorecard, niche_pulse, ...).
  artifacts jsonb not null default '{}'::jsonb,
  -- 3 стратегии: defensive / blind_spot / new_category.
  strategies jsonb not null default '{}'::jsonb,

  -- Публичный share-токен; null до момента публикации.
  share_id text unique,

  error text,
  model_meta jsonb not null default '{}'::jsonb,

  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_niche_snapshots_project
  on public.niche_snapshots (project_id, created_at desc);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.competitor_profiles enable row level security;
alter table public.competitor_audits enable row level security;
alter table public.niche_snapshots enable row level security;

create policy "Users manage own competitor profiles"
  on public.competitor_profiles for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = competitor_profiles.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = competitor_profiles.project_id and p.user_id = auth.uid()
    )
  );

-- Аудиты конкурентов пишутся edge-функцией от service-role, клиент только читает.
create policy "Users read own competitor audits"
  on public.competitor_audits for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = competitor_audits.project_id and p.user_id = auth.uid()
    )
  );

-- Snapshot: клиент читает свои, плюс публичные через share_id (отдаём через edge fn,
-- но оставим возможность читать клиенту, если он владелец).
create policy "Users read own niche snapshots"
  on public.niche_snapshots for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = niche_snapshots.project_id and p.user_id = auth.uid()
    )
  );

-- ─── triggers ────────────────────────────────────────────────────────────────
drop trigger if exists competitor_profiles_set_updated_at on public.competitor_profiles;
create trigger competitor_profiles_set_updated_at
  before update on public.competitor_profiles
  for each row execute function public.set_updated_at();

drop trigger if exists niche_snapshots_set_updated_at on public.niche_snapshots;
create trigger niche_snapshots_set_updated_at
  before update on public.niche_snapshots
  for each row execute function public.set_updated_at();
