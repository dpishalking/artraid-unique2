-- User-submitted feature / product ideas (writes via edge function only)

create table if not exists public.product_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  message text not null check (char_length(message) >= 10 and char_length(message) <= 2000),
  page_path text,
  source text not null default 'fab',
  user_agent text,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_ideas_created on public.product_ideas (created_at desc);
create index if not exists idx_product_ideas_ip_created on public.product_ideas (ip, created_at desc);

alter table public.product_ideas enable row level security;

create policy "No client read on product_ideas"
  on public.product_ideas for select
  using (false);

create policy "No client insert on product_ideas"
  on public.product_ideas for insert
  with check (false);
