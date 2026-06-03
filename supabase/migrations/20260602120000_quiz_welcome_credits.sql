-- Quiz onboarding: 30 welcome credits on signup (was 1)

create or replace function public.handle_new_user_credits()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_credits (user_id, balance, total_purchased)
  values (new.id, 30, 0);

  insert into public.credit_transactions (user_id, amount, type, description)
  values (new.id, 30, 'bonus', 'Стартовый пакет: 30 генераций');

  return new;
end;
$$;
