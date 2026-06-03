-- Admin cabinet: monetization + operations tables

-- ─── profiles extensions ─────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'support', 'analyst', 'prompt_manager', 'admin', 'super_admin')),
  add column if not exists status text not null default 'active'
    check (status in ('active', 'blocked', 'pending')),
  add column if not exists company_name text,
  add column if not exists source text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists last_login_at timestamptz;

-- Promote known admin emails
update public.profiles
set role = 'super_admin'
where lower(email) in ('tvtska@gmail.com', 'd.pishalkin@gmail.com');

-- ─── packages ────────────────────────────────────────────────────────────────
create table if not exists public.packages (
  id text primary key,
  name text not null,
  subtitle text,
  description text,
  price integer not null,
  currency text not null default 'RUB',
  credits_amount integer not null check (credits_amount > 0),
  price_per_generation integer,
  savings_text text,
  badge_text text,
  is_popular boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  button_text text,
  features jsonb not null default '[]'::jsonb,
  legal_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── payments ────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  package_id text not null references public.packages(id),
  amount integer not null,
  currency text not null default 'RUB',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  payment_provider text,
  provider_payment_id text,
  provider_checkout_url text,
  idempotency_key text unique,
  paid_at timestamptz,
  metadata jsonb,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_user_created on public.payments(user_id, created_at desc);
create index if not exists idx_payments_status on public.payments(status, created_at desc);

-- ─── credit_transactions extensions ──────────────────────────────────────────
alter table public.credit_transactions
  add column if not exists balance_after integer,
  add column if not exists payment_id uuid references public.payments(id) on delete set null,
  add column if not exists package_id text references public.packages(id) on delete set null,
  add column if not exists generation_id uuid,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- ─── generations ─────────────────────────────────────────────────────────────
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prototype_id uuid references public.prototypes(id) on delete set null,
  type text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'success', 'failed', 'cancelled')),
  input_data jsonb,
  output_data jsonb,
  credits_spent integer not null default 0,
  payment_id uuid references public.payments(id) on delete set null,
  package_id text references public.packages(id) on delete set null,
  model text,
  prompt_id uuid,
  prompt_version integer,
  tokens_used integer,
  estimated_cost numeric(12, 4),
  duration_ms integer,
  error_message text,
  quality_mark text check (quality_mark is null or quality_mark in ('good', 'bad')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_generations_user_created on public.generations(user_id, created_at desc);
create index if not exists idx_generations_status on public.generations(status, created_at desc);

alter table public.credit_transactions
  drop constraint if exists credit_transactions_generation_id_fkey;
alter table public.credit_transactions
  add constraint credit_transactions_generation_id_fkey
  foreign key (generation_id) references public.generations(id) on delete set null;

-- ─── prompts ─────────────────────────────────────────────────────────────────
create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  type text not null,
  version integer not null default 1,
  system_prompt text,
  user_prompt_template text,
  variables jsonb default '[]'::jsonb,
  output_format text,
  is_active boolean not null default false,
  is_test boolean not null default false,
  uses_count integer not null default 0,
  good_results integer not null default 0,
  bad_results integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (type, version)
);

create index if not exists idx_prompts_type_active on public.prompts(type, is_active);

-- ─── templates (phase 2 placeholder) ─────────────────────────────────────────
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text not null,
  prompt_id uuid references public.prompts(id) on delete set null,
  credits_cost integer not null default 1,
  available_for_packages jsonb default '[]'::jsonb,
  form_schema jsonb,
  output_type text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── admin_logs ──────────────────────────────────────────────────────────────
create table if not exists public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text not null,
  message text not null,
  metadata jsonb,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'resolved', 'ignored')),
  severity text not null default 'info'
    check (severity in ('info', 'warning', 'error', 'critical')),
  service text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_logs_created on public.admin_logs(created_at desc);

-- ─── user_notes ──────────────────────────────────────────────────────────────
create table if not exists public.user_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  admin_id uuid references auth.users(id) on delete set null,
  note text not null,
  created_at timestamptz not null default now()
);

-- ─── admin_actions ───────────────────────────────────────────────────────────
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  target_type text,
  target_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ─── app_settings ────────────────────────────────────────────────────────────
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ─── RLS: deny client access (service role only) ─────────────────────────────
alter table public.packages enable row level security;
alter table public.payments enable row level security;
alter table public.generations enable row level security;
alter table public.prompts enable row level security;
alter table public.templates enable row level security;
alter table public.admin_logs enable row level security;
alter table public.user_notes enable row level security;
alter table public.admin_actions enable row level security;
alter table public.app_settings enable row level security;

-- Public read active packages for future pricing page
create policy "Anyone can read active packages"
  on public.packages for select
  using (is_active = true);

-- ─── Seed packages ───────────────────────────────────────────────────────────
insert into public.packages (
  id, name, subtitle, description, price, currency, credits_amount,
  price_per_generation, savings_text, badge_text, is_popular, is_active,
  sort_order, button_text, features, legal_text
) values
(
  'restart', 'Рестарт', 'Для первого прототипа и проверки идеи',
  'Пакет для быстрой проверки одной идеи через полный прототип лендинга.',
  490, 'RUB', 1, 490, null, null, false, true, 1,
  'Попробовать за 490₽',
  '["1 полный прототип лендинга","19 смысловых блоков с копирайтингом","Перегенерация любого блока","Экспорт в Markdown","Подходит, чтобы быстро проверить одну идею"]'::jsonb,
  'Нажимая кнопку, вы принимаете условия оферты и политику конфиденциальности.'
),
(
  'growth', 'Рост', 'Лучший выбор для теста гипотез',
  'Пакет для сравнения нескольких офферов, сегментов и подходов в упаковке.',
  1990, 'RUB', 5, 398, 'Экономия 460₽ по сравнению с покупкой по одной',
  'Выбор большинства', true, true, 2,
  'Купить 5 генераций за 1 990₽',
  '["5 полных прототипов лендинга","19 смысловых блоков с копирайтингом в каждом","Перегенерация любого блока","Экспорт в Markdown","Кредиты не сгорают","Удобно для теста нескольких гипотез","Можно сравнить разные офферы и выбрать сильнейший"]'::jsonb,
  'Нажимая кнопку, вы принимаете условия оферты и политику конфиденциальности.'
),
(
  'system', 'Система', 'Для регулярной сборки лендингов',
  'Пакет для регулярной работы с продуктами, гипотезами, офферами и прототипами.',
  2990, 'RUB', 10, 299, 'Экономия 1 910₽ по сравнению с покупкой по одной',
  null, false, true, 3,
  'Купить 10 генераций за 2 990₽',
  '["10 полных прототипов лендинга","19 смысловых блоков с копирайтингом в каждом","Перегенерация любого блока","Экспорт в Markdown","Кредиты не сгорают","Максимальная выгода за 1 генерацию","Подходит для маркетологов, продюсеров и агентств","Удобно для регулярной работы с продуктами и гипотезами"]'::jsonb,
  'Нажимая кнопку, вы принимаете условия оферты и политику конфиденциальности.'
)
on conflict (id) do nothing;

-- ─── Seed prompts (inactive placeholders) ────────────────────────────────────
insert into public.prompts (name, description, type, version, is_active, system_prompt)
select v.name, v.description, v.type, 1, false, ''
from (values
  ('Full Landing Prototype Prompt v1', 'Генерация полного прототипа', 'full_landing_prototype'),
  ('Block Regeneration Prompt v1', 'Перегенерация блока', 'block_regeneration'),
  ('Website Analysis Prompt v1', 'Аудит сайта', 'website_analysis'),
  ('Offer Generator Prompt v1', 'Генерация оффера', 'offer_generation'),
  ('Landing Structure Prompt v1', 'Структура лендинга', 'landing_structure'),
  ('Lovable Prompt Generator v1', 'Промпт для Lovable', 'lovable_prompt'),
  ('Cursor Prompt Generator v1', 'Промпт для Cursor', 'cursor_prompt'),
  ('Ben Hunt Analysis Prompt v1', 'Анализ Ben Hunt', 'ben_hunt_analysis'),
  ('StoryBrand Analysis Prompt v1', 'StoryBrand', 'storybrand_analysis'),
  ('JTBD Analysis Prompt v1', 'JTBD', 'jtbd_analysis')
) as v(name, description, type)
where not exists (select 1 from public.prompts p where p.type = v.type and p.version = 1);

-- ─── Idempotent payment → credits ────────────────────────────────────────────
create or replace function public.handle_successful_payment(p_payment_id uuid, p_admin_id uuid default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_payment payments%rowtype;
  v_package packages%rowtype;
  v_balance integer;
begin
  select * into v_payment from payments where id = p_payment_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'payment_not_found');
  end if;
  if v_payment.status = 'paid' then
    return jsonb_build_object('ok', true, 'already_paid', true);
  end if;

  select * into v_package from packages where id = v_payment.package_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'package_not_found');
  end if;

  update payments
  set status = 'paid', paid_at = coalesce(paid_at, now()), updated_at = now()
  where id = p_payment_id;

  perform add_credits(
    v_payment.user_id,
    v_package.credits_amount,
    'purchase',
    format('Покупка пакета "%s" — %s генераций', v_package.name, v_package.credits_amount),
    jsonb_build_object('payment_id', p_payment_id, 'package_id', v_package.id)
  );

  select balance into v_balance from user_credits where user_id = v_payment.user_id;

  update credit_transactions
  set payment_id = p_payment_id, package_id = v_package.id, balance_after = v_balance
  where user_id = v_payment.user_id
    and type = 'purchase'
    and created_at >= now() - interval '5 seconds';

  insert into admin_actions (admin_id, action_type, target_type, target_id, metadata)
  values (
    p_admin_id,
    'payment_marked_paid',
    'payment',
    p_payment_id::text,
    jsonb_build_object('package_id', v_package.id, 'credits', v_package.credits_amount)
  );

  return jsonb_build_object('ok', true, 'credits_added', v_package.credits_amount);
end;
$$;

-- ─── Manual credit adjustment ────────────────────────────────────────────────
create or replace function public.admin_adjust_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text,
  p_admin_id uuid
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_type text;
  v_balance integer;
begin
  if p_amount = 0 then
    return jsonb_build_object('ok', false, 'error', 'zero_amount');
  end if;

  v_type := case when p_amount > 0 then 'manual' else 'usage' end;

  perform add_credits(p_user_id, p_amount, v_type, p_description, jsonb_build_object('admin_id', p_admin_id));

  select balance into v_balance from user_credits where user_id = p_user_id;

  update credit_transactions
  set balance_after = v_balance, created_by = p_admin_id, type = case when p_amount > 0 then 'manual' else 'usage' end
  where user_id = p_user_id and created_at >= now() - interval '2 seconds';

  insert into admin_actions (admin_id, action_type, target_type, target_id, metadata)
  values (p_admin_id, 'credits_adjustment', 'user', p_user_id::text, jsonb_build_object('amount', p_amount));

  return jsonb_build_object('ok', true, 'balance', v_balance);
end;
$$;

-- updated_at triggers
create trigger packages_set_updated_at before update on public.packages
  for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments
  for each row execute function public.set_updated_at();
create trigger prompts_set_updated_at before update on public.prompts
  for each row execute function public.set_updated_at();
