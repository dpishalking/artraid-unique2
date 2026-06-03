-- Настраиваемые промпты генерации (full + clip-4) — глобально и per-product.

alter table public.forge_products
  add column if not exists generation_prompts jsonb not null default '{}'::jsonb;

create table if not exists public.forge_lab_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.forge_lab_settings enable row level security;

create policy "forge_lab_settings: staff full" on public.forge_lab_settings
  for all to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

insert into public.forge_lab_settings (key, value)
values ('generation_prompts', '{}'::jsonb)
on conflict (key) do nothing;
