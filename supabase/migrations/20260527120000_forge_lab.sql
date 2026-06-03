-- Лаборатория (Forge): внутренний CRO-конвейер для прототипов под трафик.
-- Не путать с публичным /builder и user-проектами.

-- ─── Продукты Лаборатории ─────────────────────────────────────────────────────
create table if not exists public.forge_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  status text not null default 'active'
    check (status in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_forge_products_status on public.forge_products (status);

-- ─── Knowledge Base (1:1 к продукту) ─────────────────────────────────────────
-- product/audience/usp/pains — базовые. fab_matrix = СДВ (Свойство-Действие-Выгода).
create table if not exists public.forge_knowledge_base (
  id uuid primary key default gen_random_uuid(),
  product_id uuid unique not null references public.forge_products(id) on delete cascade,

  product       jsonb not null default '{}'::jsonb,
  audience      jsonb not null default '{}'::jsonb,
  usp           jsonb not null default '{}'::jsonb,
  pains         jsonb not null default '[]'::jsonb,

  voc           jsonb not null default '[]'::jsonb,
  fab_matrix    jsonb not null default '[]'::jsonb,
  objections    jsonb not null default '[]'::jsonb,
  proofs        jsonb not null default '[]'::jsonb,
  competitors   jsonb not null default '[]'::jsonb,
  offers        jsonb not null default '[]'::jsonb,
  tone          jsonb not null default '{}'::jsonb,
  assets        jsonb not null default '[]'::jsonb,

  completion_percent integer not null default 0
    check (completion_percent >= 0 and completion_percent <= 100),

  updated_at timestamptz not null default now()
);

create index if not exists idx_forge_kb_product on public.forge_knowledge_base (product_id);

-- ─── Отзывы (отдельная таблица — будут сотни/тысячи) ─────────────────────────
create table if not exists public.forge_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.forge_products(id) on delete cascade,
  source text,
  author text,
  rating numeric,
  text text not null,
  tags text[] not null default '{}',
  is_starred boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_forge_reviews_product on public.forge_reviews (product_id, created_at desc);
create index if not exists idx_forge_reviews_tags on public.forge_reviews using gin (tags);

-- ─── Шаблоны (seed-таблица) ──────────────────────────────────────────────────
create table if not exists public.forge_templates (
  id text primary key,
  title text not null,
  description text,
  format text not null,
  blocks jsonb not null default '[]'::jsonb,
  steps jsonb,
  constraints jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.forge_templates (id, title, description, format, blocks, steps, constraints, sort_order)
values
  (
    'full',
    'Полный лендинг',
    'Длинная посадочная: hero → боль → решение → доказательства → CTA. Подходит для тёплой и осознанной аудитории.',
    'long-form',
    '["hero","pain","paradigm_shift","solution","product","social_proof","metrics","objections","faq","guarantee","final_cta"]'::jsonb,
    null,
    '{"max_chars_per_block": 1200, "cta_count": "many"}'::jsonb,
    10
  ),
  (
    'clip-4',
    'Клип-лендинг 4 экрана',
    'Цепочка из 4 страниц: hook → причина → доказательства → форма заявки. Для холодного и платного трафика.',
    'funnel',
    '[]'::jsonb,
    '[
      {"key":"hook","label":"Шаг 1. Зацепка","blocks":["hero_compact","pain_punch"]},
      {"key":"why","label":"Шаг 2. Почему это работает","blocks":["mechanism","paradigm_shift"]},
      {"key":"proof","label":"Шаг 3. Доказательства","blocks":["social_proof","metrics"]},
      {"key":"apply","label":"Шаг 4. Заявка","blocks":["lead_form_personal","guarantee","micro_trust"]}
    ]'::jsonb,
    '{"max_chars_per_screen": 600, "cta_per_screen": 1, "lead_form_fields": ["name","phone"], "persona_image": true, "consent_required": true}'::jsonb,
    20
  )
on conflict (id) do nothing;

-- ─── Прототипы Лаборатории ───────────────────────────────────────────────────
create table if not exists public.forge_prototypes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.forge_products(id) on delete cascade,
  template_id text not null references public.forge_templates(id),
  scenario_id text,

  name text not null,
  slug text unique,

  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),

  active_version_id uuid,
  meta jsonb not null default '{}'::jsonb,

  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_forge_prototypes_product on public.forge_prototypes (product_id, created_at desc);
create index if not exists idx_forge_prototypes_status on public.forge_prototypes (status);
create index if not exists idx_forge_prototypes_slug on public.forge_prototypes (slug);

-- ─── Версии прототипа ────────────────────────────────────────────────────────
create table if not exists public.forge_prototype_versions (
  id uuid primary key default gen_random_uuid(),
  prototype_id uuid not null references public.forge_prototypes(id) on delete cascade,
  version integer not null,
  content jsonb not null,
  generation_input jsonb,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (prototype_id, version)
);

create index if not exists idx_forge_versions_prototype on public.forge_prototype_versions (prototype_id, version desc);

-- ─── Лиды с публичных страниц ────────────────────────────────────────────────
create table if not exists public.forge_leads (
  id uuid primary key default gen_random_uuid(),
  prototype_id uuid not null references public.forge_prototypes(id) on delete cascade,
  name text,
  phone text,
  email text,
  message text,
  source_step text,
  utm jsonb,
  user_agent text,
  ip text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_forge_leads_prototype on public.forge_leads (prototype_id, created_at desc);
create index if not exists idx_forge_leads_status on public.forge_leads (status);

-- ─── Метрики (daily-агрегация) ────────────────────────────────────────────────
create table if not exists public.forge_metrics_daily (
  prototype_id uuid not null references public.forge_prototypes(id) on delete cascade,
  day date not null,
  visits integer not null default 0,
  step1_visits integer not null default 0,
  step4_visits integer not null default 0,
  leads integer not null default 0,
  cost_kopeks bigint not null default 0,
  updated_at timestamptz not null default now(),
  primary key (prototype_id, day)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.forge_products enable row level security;
alter table public.forge_knowledge_base enable row level security;
alter table public.forge_reviews enable row level security;
alter table public.forge_templates enable row level security;
alter table public.forge_prototypes enable row level security;
alter table public.forge_prototype_versions enable row level security;
alter table public.forge_leads enable row level security;
alter table public.forge_metrics_daily enable row level security;

-- helper: staff = роли с доступом к Лаборатории
create or replace function public.is_forge_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = uid
      and p.role in ('admin', 'super_admin', 'analyst')
  );
$$;

-- forge_products
create policy "forge_products: staff full" on public.forge_products
  for all to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

-- forge_knowledge_base
create policy "forge_kb: staff full" on public.forge_knowledge_base
  for all to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

-- forge_reviews
create policy "forge_reviews: staff full" on public.forge_reviews
  for all to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

-- forge_templates — staff read+write, anon read активных шаблонов
create policy "forge_templates: staff read" on public.forge_templates
  for select to authenticated
  using (public.is_forge_staff(auth.uid()));

create policy "forge_templates: staff write" on public.forge_templates
  for insert to authenticated
  with check (public.is_forge_staff(auth.uid()));

create policy "forge_templates: staff update" on public.forge_templates
  for update to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

-- forge_prototypes — staff полный, anon read только published
create policy "forge_prototypes: staff full" on public.forge_prototypes
  for all to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

create policy "forge_prototypes: public read published" on public.forge_prototypes
  for select to anon
  using (status = 'published');

create policy "forge_prototypes: auth read published" on public.forge_prototypes
  for select to authenticated
  using (status = 'published' or public.is_forge_staff(auth.uid()));

-- forge_prototype_versions — staff полный, anon read через join к published
create policy "forge_versions: staff full" on public.forge_prototype_versions
  for all to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

create policy "forge_versions: public read active" on public.forge_prototype_versions
  for select to anon
  using (
    exists (
      select 1 from public.forge_prototypes p
      where p.active_version_id = forge_prototype_versions.id
        and p.status = 'published'
    )
  );

create policy "forge_versions: auth read active" on public.forge_prototype_versions
  for select to authenticated
  using (
    public.is_forge_staff(auth.uid())
    or exists (
      select 1 from public.forge_prototypes p
      where p.active_version_id = forge_prototype_versions.id
        and p.status = 'published'
    )
  );

-- forge_leads — INSERT для всех (форма с публички), SELECT/UPDATE только staff
create policy "forge_leads: public insert" on public.forge_leads
  for insert to anon
  with check (true);

create policy "forge_leads: auth insert" on public.forge_leads
  for insert to authenticated
  with check (true);

create policy "forge_leads: staff read" on public.forge_leads
  for select to authenticated
  using (public.is_forge_staff(auth.uid()));

create policy "forge_leads: staff update" on public.forge_leads
  for update to authenticated
  using (public.is_forge_staff(auth.uid()))
  with check (public.is_forge_staff(auth.uid()));

-- forge_metrics_daily — staff read, edge function пишет через service role
create policy "forge_metrics: staff read" on public.forge_metrics_daily
  for select to authenticated
  using (public.is_forge_staff(auth.uid()));

-- ─── Trigger updated_at ──────────────────────────────────────────────────────
create or replace function public.forge_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_forge_products_updated on public.forge_products;
create trigger trg_forge_products_updated before update on public.forge_products
  for each row execute function public.forge_touch_updated_at();

drop trigger if exists trg_forge_kb_updated on public.forge_knowledge_base;
create trigger trg_forge_kb_updated before update on public.forge_knowledge_base
  for each row execute function public.forge_touch_updated_at();

drop trigger if exists trg_forge_prototypes_updated on public.forge_prototypes;
create trigger trg_forge_prototypes_updated before update on public.forge_prototypes
  for each row execute function public.forge_touch_updated_at();

comment on table public.forge_products is 'Лаборатория: продукты для генерации прототипов под трафик';
comment on table public.forge_knowledge_base is 'Лаборатория: база знаний продукта (1:1)';
comment on table public.forge_reviews is 'Лаборатория: отзывы с тегами (для VOC и копирайтинга)';
comment on table public.forge_templates is 'Лаборатория: шаблоны страниц (full, clip-4, ...)';
comment on table public.forge_prototypes is 'Лаборатория: прототипы (draft/published) для трафика';
comment on table public.forge_prototype_versions is 'Лаборатория: история версий контента прототипа';
comment on table public.forge_leads is 'Лаборатория: заявки с публичных страниц /lp/:slug';
comment on table public.forge_metrics_daily is 'Лаборатория: daily-агрегация трафика и конверсий';
