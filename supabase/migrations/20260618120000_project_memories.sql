-- Память проекта: расширенная структура + предложения обновлений из анализов

create table if not exists public.project_memories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects (id) on delete cascade,

  company jsonb not null default '{}'::jsonb,
  founder jsonb not null default '{}'::jsonb,
  product jsonb not null default '{}'::jsonb,
  audience jsonb not null default '{}'::jsonb,
  pains_desires jsonb not null default '{}'::jsonb,
  offer_positioning jsonb not null default '{}'::jsonb,
  websites jsonb not null default '{}'::jsonb,

  competitors jsonb not null default '[]'::jsonb,
  proofs jsonb not null default '{}'::jsonb,
  objections jsonb not null default '[]'::jsonb,

  pricing jsonb not null default '{}'::jsonb,
  business_metrics jsonb not null default '{}'::jsonb,
  tone jsonb not null default '{}'::jsonb,
  constraints jsonb not null default '{}'::jsonb,

  completion_percent integer not null default 0
    check (completion_percent >= 0 and completion_percent <= 100),
  completion_level text not null default 'empty',
  badges jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_project_memories_project on public.project_memories (project_id);

create table if not exists public.project_memory_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,

  source_type text not null,
  source_id text,
  section text not null,
  field text not null,

  old_value jsonb,
  suggested_value jsonb not null,

  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'edited')),

  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create index if not exists idx_project_memory_updates_project
  on public.project_memory_updates (project_id, status, created_at desc);

alter table public.project_memories enable row level security;
alter table public.project_memory_updates enable row level security;

create policy "Users manage own project memories"
  on public.project_memories for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_memories.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_memories.project_id and p.user_id = auth.uid()
    )
  );

create policy "Users manage own project memory updates"
  on public.project_memory_updates for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_memory_updates.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_memory_updates.project_id and p.user_id = auth.uid()
    )
  );

drop trigger if exists project_memories_set_updated_at on public.project_memories;
create trigger project_memories_set_updated_at before update on public.project_memories
  for each row execute function public.set_updated_at();

insert into public.project_memories (project_id)
select p.id from public.projects p
where not exists (select 1 from public.project_memories m where m.project_id = p.id);
