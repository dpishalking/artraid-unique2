-- Публичный конфигуратор лендингов по ссылке (поддомен studio.*).
-- KB и промпты остаются на сервере; клиент видит только allowed options.

create table if not exists public.forge_studio_portals (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(18), 'hex'),
  product_id uuid not null references public.forge_products(id) on delete cascade,
  title text not null,
  subtitle text,
  allowed_templates text[] not null default array['full', 'clip-4']::text[],
  allowed_scenarios text[] not null default array['cold_traffic']::text[],
  /** null = все направления из KB продукта */
  allowed_direction_slugs text[],
  allowed_formats text[] not null default array['kitchen', 'classic', 'agora', 'longread']::text[],
  max_generations_per_day integer not null default 15 check (max_generations_per_day > 0),
  generations_today integer not null default 0,
  generations_day date,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_forge_studio_portals_product
  on public.forge_studio_portals (product_id, created_at desc);

create index if not exists idx_forge_studio_portals_token
  on public.forge_studio_portals (token) where is_active = true;

alter table public.forge_prototypes
  add column if not exists studio_portal_id uuid references public.forge_studio_portals(id) on delete set null;

create index if not exists idx_forge_prototypes_studio_portal
  on public.forge_prototypes (studio_portal_id, created_at desc);

alter table public.forge_studio_portals enable row level security;

create policy "forge_studio_portals: staff full" on public.forge_studio_portals
  for all to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

drop trigger if exists trg_forge_studio_portals_updated on public.forge_studio_portals;
create trigger trg_forge_studio_portals_updated before update on public.forge_studio_portals
  for each row execute function public.forge_touch_updated_at();

comment on table public.forge_studio_portals is 'Публичные ссылки studio.* — конфигуратор без доступа к KB';
