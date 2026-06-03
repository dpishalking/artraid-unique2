-- Project planning layer: goal, North Star, deadline, focus and strategy drafts.

create table if not exists public.project_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  goal text,
  north_star_metric_id uuid references public.commercial_metrics(id) on delete set null,
  horizon text not null default 'month'
    check (horizon in ('month', 'quarter', 'year', 'custom')),
  deadline date,
  focus text,
  strategies jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id)
);

create index if not exists idx_project_plans_project
  on public.project_plans (project_id);

alter table public.project_plans enable row level security;

create policy "Users manage own project plans"
  on public.project_plans for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_plans.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_plans.project_id and p.user_id = auth.uid()
    )
  );

drop trigger if exists project_plans_set_updated_at on public.project_plans;
create trigger project_plans_set_updated_at
  before update on public.project_plans
  for each row execute function public.set_updated_at();
