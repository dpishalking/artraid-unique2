-- Commercial project metrics (plan/fact, traffic light, hypothesis linkage)

create table if not exists public.commercial_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  slug text,
  name text not null,
  category text not null,
  description text,
  unit text,
  plan_value numeric,
  fact_value numeric,
  period text not null default 'month',
  direction text not null default 'higher_is_better'
    check (direction in ('higher_is_better', 'lower_is_better', 'target_range')),
  range_norm numeric,
  range_tolerance numeric,
  range_critical numeric,
  data_source text,
  owner_name text,
  comment text,
  is_custom boolean not null default false,
  is_hidden boolean not null default false,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_commercial_metrics_project_slug
  on public.commercial_metrics (project_id, slug)
  where slug is not null;

create index if not exists idx_commercial_metrics_project_category
  on public.commercial_metrics (project_id, category, sort_order);

create index if not exists idx_commercial_metrics_project_primary
  on public.commercial_metrics (project_id, is_primary)
  where is_primary = true;

alter table public.commercial_metrics enable row level security;

create policy "Users manage own commercial metrics"
  on public.commercial_metrics for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = commercial_metrics.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = commercial_metrics.project_id and p.user_id = auth.uid()
    )
  );

alter table public.hypotheses
  add column if not exists commercial_metric_id uuid
    references public.commercial_metrics(id) on delete set null;

create index if not exists idx_hypotheses_commercial_metric
  on public.hypotheses (commercial_metric_id)
  where commercial_metric_id is not null;

drop trigger if exists commercial_metrics_set_updated_at on public.commercial_metrics;
create trigger commercial_metrics_set_updated_at
  before update on public.commercial_metrics
  for each row execute function public.set_updated_at();
