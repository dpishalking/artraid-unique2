-- ─── user_credits ────────────────────────────────────────────────────────────
create table if not exists public.user_credits (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  balance         integer not null default 0 check (balance >= 0),
  total_used      integer not null default 0,
  total_purchased integer not null default 0,
  updated_at      timestamptz not null default now()
);

alter table public.user_credits enable row level security;

create policy "Users can view own credits"
  on public.user_credits for select
  using (auth.uid() = user_id);

-- ─── credit_transactions ─────────────────────────────────────────────────────
create table if not exists public.credit_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      integer not null,   -- positive = added, negative = spent
  type        text not null check (type in ('bonus', 'purchase', 'usage', 'refund', 'manual')),
  description text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

alter table public.credit_transactions enable row level security;

create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- ─── give 1 free credit on signup ────────────────────────────────────────────
create or replace function public.handle_new_user_credits()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_credits (user_id, balance, total_purchased)
  values (new.id, 1, 0);

  insert into public.credit_transactions (user_id, amount, type, description)
  values (new.id, 1, 'bonus', 'Бесплатная генерация при регистрации');

  return new;
end;
$$;

-- drop if exists so re-running is safe
drop trigger if exists on_auth_user_created_credits on auth.users;

create trigger on_auth_user_created_credits
  after insert on auth.users
  for each row execute procedure public.handle_new_user_credits();

-- ─── deduct_credit RPC (called from edge function after generation) ──────────
create or replace function public.deduct_credit(p_user_id uuid, p_prototype_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.user_credits
  set
    balance     = balance - 1,
    total_used  = total_used + 1,
    updated_at  = now()
  where user_id = p_user_id and balance >= 1;

  insert into public.credit_transactions (user_id, amount, type, description, metadata)
  values (
    p_user_id,
    -1,
    'usage',
    'Генерация прототипа',
    jsonb_build_object('prototype_id', p_prototype_id)
  );
end;
$$;

-- ─── add_credits RPC (for manual top-up / future payment webhook) ────────────
create or replace function public.add_credits(p_user_id uuid, p_amount integer, p_type text, p_description text, p_metadata jsonb default null)
returns void language plpgsql security definer as $$
begin
  insert into public.user_credits (user_id, balance, total_purchased)
  values (p_user_id, p_amount, case when p_type = 'purchase' then p_amount else 0 end)
  on conflict (user_id) do update
  set
    balance          = public.user_credits.balance + p_amount,
    total_purchased  = public.user_credits.total_purchased + case when p_type = 'purchase' then p_amount else 0 end,
    updated_at       = now();

  insert into public.credit_transactions (user_id, amount, type, description, metadata)
  values (p_user_id, p_amount, p_type, p_description, p_metadata);
end;
$$;
