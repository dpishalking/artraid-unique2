-- Sprint A: projects ecosystem foundation

-- ─── projects ────────────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  product_name text,
  product_description text not null,
  current_website_url text,
  target_audience text not null,
  main_goal text not null,
  current_offer text,
  competitors jsonb not null default '[]'::jsonb,
  additional_context text,
  status text not null default 'active'
    check (status in ('active', 'archived', 'deleted')),
  packaging_score integer check (packaging_score is null or (packaging_score >= 0 and packaging_score <= 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now()
);

create index if not exists idx_projects_user_activity on public.projects (user_id, last_activity_at desc);

-- ─── project_contexts (1:1) ──────────────────────────────────────────────────
create table if not exists public.project_contexts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  product_name text,
  product_description text,
  market_category text,
  target_audience text,
  audience_segments jsonb not null default '[]'::jsonb,
  main_pain text,
  secondary_pains jsonb not null default '[]'::jsonb,
  main_desire text,
  desired_outcomes jsonb not null default '[]'::jsonb,
  current_offer text,
  key_promise text,
  positioning text,
  unique_mechanism text,
  price_range text,
  current_website_url text,
  competitors jsonb not null default '[]'::jsonb,
  key_proofs jsonb not null default '[]'::jsonb,
  objections jsonb not null default '[]'::jsonb,
  tone_of_voice text,
  constraints text,
  previous_attempts text,
  important_notes text,
  missing_data jsonb not null default '[]'::jsonb,
  recommended_next_step text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── project_events (history) ────────────────────────────────────────────────
create table if not exists public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  title text not null,
  description text,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_events_project on public.project_events (project_id, created_at desc);

-- ─── stubs for sprint B/C (structure only) ───────────────────────────────────
create table if not exists public.project_insights (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  insight_type text not null,
  title text not null,
  description text,
  evidence text,
  confidence text not null default 'medium'
    check (confidence in ('low', 'medium', 'high')),
  is_applied boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_insights_project on public.project_insights (project_id, created_at desc);

create table if not exists public.hypotheses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type text,
  source_generation_id uuid,
  title text not null,
  description text,
  type text not null default 'offer',
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  status text not null default 'new'
    check (status in ('new', 'selected', 'in_progress', 'implemented', 'rejected', 'tested', 'won', 'lost')),
  what_to_change text,
  why text,
  expected_impact text,
  implementation_difficulty text,
  example_copy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hypotheses_project on public.hypotheses (project_id, created_at desc);

-- ─── optional FK columns for sprint B (non-breaking) ─────────────────────────
alter table public.prototypes
  add column if not exists project_id uuid references public.projects(id) on delete set null;

alter table public.generations
  add column if not exists project_id uuid references public.projects(id) on delete set null;

alter table public.analysis_logs
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists project_id uuid references public.projects(id) on delete set null;

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.projects enable row level security;
alter table public.project_contexts enable row level security;
alter table public.project_events enable row level security;
alter table public.project_insights enable row level security;
alter table public.hypotheses enable row level security;

create policy "Users manage own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own project contexts"
  on public.project_contexts for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_contexts.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_contexts.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own project events"
  on public.project_events for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_events.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_events.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own project insights"
  on public.project_insights for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_insights.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_insights.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own hypotheses"
  on public.hypotheses for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = hypotheses.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = hypotheses.project_id and p.user_id = auth.uid()
    )
  );

-- ─── triggers ──────────────────────────────────────────────────────────────────
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists project_contexts_set_updated_at on public.project_contexts;
create trigger project_contexts_set_updated_at before update on public.project_contexts
  for each row execute function public.set_updated_at();

drop trigger if exists hypotheses_set_updated_at on public.hypotheses;
create trigger hypotheses_set_updated_at before update on public.hypotheses
  for each row execute function public.set_updated_at();
