-- Расширяем is_forge_staff: пускаем по profiles.role ИЛИ по email из admin-списка.
-- Также промоутим текущие admin-email до super_admin (идемпотентно).

create or replace function public.is_forge_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.profiles p
      where p.user_id = uid
        and p.role in ('admin', 'super_admin', 'analyst')
    )
    or exists (
      select 1
      from auth.users u
      where u.id = uid
        and lower(u.email) in (
          'tvtska@gmail.com',
          'd.pishalkin@gmail.com',
          'd.pishalking@gmail.com'
        )
    );
$$;

-- Промоутим оба варианта написания email
update public.profiles
set role = 'super_admin'
where lower(email) in (
  'tvtska@gmail.com',
  'd.pishalkin@gmail.com',
  'd.pishalking@gmail.com'
);
