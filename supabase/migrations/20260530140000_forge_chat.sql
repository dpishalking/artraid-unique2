-- Forge Lab: чат-ассистент (thread на прототип)
create table if not exists public.forge_chat_threads (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.forge_products(id) on delete cascade,
  prototype_id uuid references public.forge_prototypes(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  role text not null default 'kb_curator'
    check (role in ('kb_curator', 'copy_editor', 'test_strategist')),
  message_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_forge_chat_thread_prototype
  on public.forge_chat_threads (prototype_id)
  where prototype_id is not null;

create index if not exists idx_forge_chat_threads_product
  on public.forge_chat_threads (product_id);

create table if not exists public.forge_chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forge_chat_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_forge_chat_messages_thread
  on public.forge_chat_messages (thread_id, created_at);

alter table public.forge_chat_threads enable row level security;
alter table public.forge_chat_messages enable row level security;

create policy "forge_chat_threads: staff full" on public.forge_chat_threads
  for all to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

create policy "forge_chat_messages: staff full" on public.forge_chat_messages
  for all to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

drop trigger if exists trg_forge_chat_threads_updated on public.forge_chat_threads;
create trigger trg_forge_chat_threads_updated before update on public.forge_chat_threads
  for each row execute function public.forge_touch_updated_at();

comment on table public.forge_chat_threads is 'Лаборатория: диалог ассистента (1 thread на прототип в MVP)';
comment on table public.forge_chat_messages is 'Лаборатория: сообщения чата Forge Lab';
