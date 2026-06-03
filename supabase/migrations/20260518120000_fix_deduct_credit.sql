-- Only deduct when balance is available; avoid orphan transactions
drop function if exists public.deduct_credit(uuid, uuid);

create or replace function public.deduct_credit(p_user_id uuid, p_prototype_id uuid)
returns boolean
language plpgsql
security definer
as $$
declare
  rows_updated integer;
begin
  update public.user_credits
  set
    balance     = balance - 1,
    total_used  = total_used + 1,
    updated_at  = now()
  where user_id = p_user_id and balance >= 1;

  get diagnostics rows_updated = row_count;
  if rows_updated = 0 then
    return false;
  end if;

  insert into public.credit_transactions (user_id, amount, type, description, metadata)
  values (
    p_user_id,
    -1,
    'usage',
    'Генерация прототипа',
    jsonb_build_object('prototype_id', p_prototype_id)
  );

  return true;
end;
$$;
