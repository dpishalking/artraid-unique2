-- Project context files: метаданные + приватное хранилище (путь начинается с user_id).

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null default 'application/octet-stream',
  size_bytes bigint not null check (size_bytes >= 0 and size_bytes <= 8388608),
  extracted_text text,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'ready', 'failed', 'skipped')),
  extraction_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_files_unique_path unique (project_id, storage_path)
);

create index if not exists idx_project_files_project on public.project_files (project_id, created_at desc);
create index if not exists idx_project_files_user on public.project_files (user_id, created_at desc);

drop trigger if exists project_files_set_updated_at on public.project_files;
create trigger project_files_set_updated_at before update on public.project_files
  for each row execute function public.set_updated_at();

alter table public.project_files enable row level security;

create policy "Users manage own project files"
  on public.project_files for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.user_id = auth.uid()
    )
    and project_files.user_id = auth.uid()
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_files.project_id and p.user_id = auth.uid()
    )
    and project_files.user_id = auth.uid()
  );

comment on table public.project_files is 'Файлы проекта: бинарь в Storage, извлечённый текст для AI-контекста.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', false, 8388608, null)
on conflict (id) do nothing;

drop policy if exists "project-files select own" on storage.objects;
drop policy if exists "project-files insert own" on storage.objects;
drop policy if exists "project-files update own" on storage.objects;
drop policy if exists "project-files delete own" on storage.objects;

create policy "project-files select own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project-files insert own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project-files update own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "project-files delete own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'project-files'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
