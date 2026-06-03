-- Исходные документы продукта (текст из PDF/txt — для KB и генерации прототипов)
alter table public.forge_knowledge_base
  add column if not exists source_documents jsonb not null default '[]'::jsonb;

comment on column public.forge_knowledge_base.source_documents is
  'Массив { id, filename, text, char_count, uploaded_at } — загруженные материалы продукта';
