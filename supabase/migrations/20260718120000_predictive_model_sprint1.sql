-- Sprint 1: Predictive model inside project hub

create table if not exists public.predictive_models (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  year integer not null check (year between 2000 and 2100),
  currency text not null default 'RUB',
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, year)
);

create table if not exists public.predictive_categories (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.predictive_models(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.predictive_metrics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.predictive_categories(id) on delete cascade,
  name text not null,
  type text not null default 'number'
    check (type in ('number', 'currency', 'percent', 'ratio', 'days', 'count')),
  unit text,
  owner_name text,
  owner_id uuid references auth.users(id) on delete set null,
  calculation_type text not null default 'manual'
    check (calculation_type in ('manual', 'formula', 'imported', 'mixed')),
  aggregation_type text not null default 'sum'
    check (aggregation_type in ('sum', 'average', 'weighted_average', 'last_value', 'formula')),
  direction text not null default 'higher_is_better'
    check (direction in ('higher_is_better', 'lower_is_better', 'target_is_better')),
  is_active boolean not null default true,
  is_lag_metric boolean not null default false,
  is_lead_metric boolean not null default false,
  is_activity_metric boolean not null default false,
  is_capacity_metric boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.predictive_periods (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.predictive_models(id) on delete cascade,
  type text not null check (type in ('year', 'quarter', 'month', 'week', 'day')),
  year integer not null,
  quarter integer check (quarter is null or quarter between 1 and 4),
  month integer check (month is null or month between 1 and 12),
  week integer check (week is null or week between 1 and 53),
  date date,
  start_date date not null,
  end_date date not null,
  parent_period_id uuid references public.predictive_periods(id) on delete cascade,
  sort_order integer not null default 0
);

create index if not exists idx_predictive_periods_model_type on public.predictive_periods(model_id, type, sort_order);
create unique index if not exists uq_predictive_periods_month on public.predictive_periods(model_id, type, year, month) where type = 'month';

create table if not exists public.predictive_plan_values (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.predictive_metrics(id) on delete cascade,
  period_id uuid not null references public.predictive_periods(id) on delete cascade,
  value numeric,
  is_manual boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metric_id, period_id)
);

create table if not exists public.predictive_fact_values (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.predictive_metrics(id) on delete cascade,
  period_id uuid not null references public.predictive_periods(id) on delete cascade,
  value numeric,
  source text not null default 'manual',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (metric_id, period_id)
);

create table if not exists public.predictive_calculated_values (
  id uuid primary key default gen_random_uuid(),
  metric_id uuid not null references public.predictive_metrics(id) on delete cascade,
  period_id uuid not null references public.predictive_periods(id) on delete cascade,
  ptf_percent numeric,
  deviation numeric,
  run_rate numeric,
  forecast numeric,
  forecast_achievement numeric,
  status text not null default 'status-empty'
    check (status in ('status-green', 'status-yellow', 'status-red', 'status-empty')),
  calculated_at timestamptz not null default now(),
  unique (metric_id, period_id)
);

create table if not exists public.predictive_metric_dependencies (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.predictive_models(id) on delete cascade,
  parent_metric_id uuid not null references public.predictive_metrics(id) on delete cascade,
  child_metric_id uuid not null references public.predictive_metrics(id) on delete cascade,
  formula_hint text,
  created_at timestamptz not null default now(),
  unique (parent_metric_id, child_metric_id)
);

create table if not exists public.predictive_comments (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.predictive_models(id) on delete cascade,
  metric_id uuid references public.predictive_metrics(id) on delete cascade,
  period_id uuid references public.predictive_periods(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  comment text not null,
  root_cause text,
  action_plan text,
  responsible text,
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.predictive_alerts (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.predictive_models(id) on delete cascade,
  metric_id uuid references public.predictive_metrics(id) on delete cascade,
  period_id uuid references public.predictive_periods(id) on delete cascade,
  alert_type text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'ignored')),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.predictive_action_items (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.predictive_models(id) on delete cascade,
  metric_id uuid references public.predictive_metrics(id) on delete set null,
  period_id uuid references public.predictive_periods(id) on delete set null,
  reason text,
  task text not null,
  responsible text,
  deadline date,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'done', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_predictive_models_project on public.predictive_models(project_id, year desc);
create index if not exists idx_predictive_categories_model on public.predictive_categories(model_id, sort_order);
create index if not exists idx_predictive_metrics_category on public.predictive_metrics(category_id, sort_order);
create index if not exists idx_predictive_plan_metric on public.predictive_plan_values(metric_id, period_id);
create index if not exists idx_predictive_fact_metric on public.predictive_fact_values(metric_id, period_id);
create index if not exists idx_predictive_comments_model on public.predictive_comments(model_id, created_at desc);
create index if not exists idx_predictive_alerts_model on public.predictive_alerts(model_id, status, created_at desc);

alter table public.predictive_models enable row level security;
alter table public.predictive_categories enable row level security;
alter table public.predictive_metrics enable row level security;
alter table public.predictive_periods enable row level security;
alter table public.predictive_plan_values enable row level security;
alter table public.predictive_fact_values enable row level security;
alter table public.predictive_calculated_values enable row level security;
alter table public.predictive_metric_dependencies enable row level security;
alter table public.predictive_comments enable row level security;
alter table public.predictive_alerts enable row level security;
alter table public.predictive_action_items enable row level security;

create policy "Users manage own predictive models"
  on public.predictive_models for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = predictive_models.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = predictive_models.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive categories"
  on public.predictive_categories for all
  using (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_categories.model_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_categories.model_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive metrics"
  on public.predictive_metrics for all
  using (
    exists (
      select 1
      from public.predictive_categories c
      join public.predictive_models m on m.id = c.model_id
      join public.projects p on p.id = m.project_id
      where c.id = predictive_metrics.category_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_categories c
      join public.predictive_models m on m.id = c.model_id
      join public.projects p on p.id = m.project_id
      where c.id = predictive_metrics.category_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive periods"
  on public.predictive_periods for all
  using (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_periods.model_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_periods.model_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive plan values"
  on public.predictive_plan_values for all
  using (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      join public.projects p on p.id = m.project_id
      where mt.id = predictive_plan_values.metric_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      join public.projects p on p.id = m.project_id
      where mt.id = predictive_plan_values.metric_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive fact values"
  on public.predictive_fact_values for all
  using (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      join public.projects p on p.id = m.project_id
      where mt.id = predictive_fact_values.metric_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      join public.projects p on p.id = m.project_id
      where mt.id = predictive_fact_values.metric_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive calculated values"
  on public.predictive_calculated_values for all
  using (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      join public.projects p on p.id = m.project_id
      where mt.id = predictive_calculated_values.metric_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_metrics mt
      join public.predictive_categories c on c.id = mt.category_id
      join public.predictive_models m on m.id = c.model_id
      join public.projects p on p.id = m.project_id
      where mt.id = predictive_calculated_values.metric_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive dependencies"
  on public.predictive_metric_dependencies for all
  using (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_metric_dependencies.model_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_metric_dependencies.model_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive comments"
  on public.predictive_comments for all
  using (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_comments.model_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_comments.model_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive alerts"
  on public.predictive_alerts for all
  using (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_alerts.model_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_alerts.model_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own predictive action items"
  on public.predictive_action_items for all
  using (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_action_items.model_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.predictive_models m
      join public.projects p on p.id = m.project_id
      where m.id = predictive_action_items.model_id and p.user_id = auth.uid()
    )
  );

drop trigger if exists predictive_models_set_updated_at on public.predictive_models;
create trigger predictive_models_set_updated_at
  before update on public.predictive_models
  for each row execute function public.set_updated_at();

drop trigger if exists predictive_metrics_set_updated_at on public.predictive_metrics;
create trigger predictive_metrics_set_updated_at
  before update on public.predictive_metrics
  for each row execute function public.set_updated_at();

drop trigger if exists predictive_plan_values_set_updated_at on public.predictive_plan_values;
create trigger predictive_plan_values_set_updated_at
  before update on public.predictive_plan_values
  for each row execute function public.set_updated_at();

drop trigger if exists predictive_fact_values_set_updated_at on public.predictive_fact_values;
create trigger predictive_fact_values_set_updated_at
  before update on public.predictive_fact_values
  for each row execute function public.set_updated_at();

drop trigger if exists predictive_comments_set_updated_at on public.predictive_comments;
create trigger predictive_comments_set_updated_at
  before update on public.predictive_comments
  for each row execute function public.set_updated_at();

drop trigger if exists predictive_alerts_set_updated_at on public.predictive_alerts;
create trigger predictive_alerts_set_updated_at
  before update on public.predictive_alerts
  for each row execute function public.set_updated_at();

drop trigger if exists predictive_action_items_set_updated_at on public.predictive_action_items;
create trigger predictive_action_items_set_updated_at
  before update on public.predictive_action_items
  for each row execute function public.set_updated_at();
