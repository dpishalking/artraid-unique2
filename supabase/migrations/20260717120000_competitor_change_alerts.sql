-- Алерты об изменениях у конкурентов (cron rescan).
create table if not exists public.competitor_change_alerts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  competitor_id uuid not null references public.competitor_profiles (id) on delete cascade,

  alert_type text not null
    check (alert_type in ('page_changed', 'rescan_failed')),
  message text not null,

  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_competitor_change_alerts_project
  on public.competitor_change_alerts (project_id, created_at desc);

create index if not exists idx_competitor_change_alerts_unread
  on public.competitor_change_alerts (project_id, acknowledged_at)
  where acknowledged_at is null;

alter table public.competitor_change_alerts enable row level security;

create policy "Users read own competitor alerts"
  on public.competitor_change_alerts for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = competitor_change_alerts.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users acknowledge own competitor alerts"
  on public.competitor_change_alerts for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = competitor_change_alerts.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = competitor_change_alerts.project_id and p.user_id = auth.uid()
    )
  );
