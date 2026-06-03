-- Данные квиза после онбординга: снимок для админки/аудита и связь с памятью проекта

alter table public.projects
  add column if not exists quiz_completed boolean not null default false;

alter table public.projects
  add column if not exists quiz_answers_snapshot jsonb;

alter table public.projects
  add column if not exists quiz_synced_at timestamptz;

alter table public.projects
  add column if not exists quiz_memory_mapped_fields text[] default '{}'::text[];

comment on column public.projects.quiz_completed is 'Пользователь завершил онбординговый квиз для этого проекта';
comment on column public.projects.quiz_answers_snapshot is 'Снимок ответов квиза (JSON)';
comment on column public.projects.quiz_synced_at is 'Когда ответы квиза синхронизировали в память проекта';
