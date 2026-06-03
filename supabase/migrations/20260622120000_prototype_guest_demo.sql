-- Гостевые прототипы без аккаунта + поле для лимита по IP

alter table public.prototypes
  alter column user_id drop not null;

alter table public.prototypes
  add column if not exists anonymous_demo boolean not null default false;

alter table public.prototypes
  add column if not exists creator_ip text;

create index if not exists idx_prototypes_anonymous_ip_day
  on public.prototypes (creator_ip, created_at desc)
  where anonymous_demo is true and user_id is null;

comment on column public.prototypes.anonymous_demo is 'Создан без входа (демо), доступен по ссылке /p/:id через RLS';
comment on column public.prototypes.creator_ip is 'IP клиента для суточного лимита демо-генераций';

-- Публичное чтение только помеченных гостевых прототипов (id — случайный UUID)
create policy "Anyone can select anonymous demo prototypes"
  on public.prototypes for select
  using (anonymous_demo is true and user_id is null);

alter table public.generations
  alter column user_id drop not null;
