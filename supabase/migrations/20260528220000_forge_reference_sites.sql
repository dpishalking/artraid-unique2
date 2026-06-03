-- Референс-сайты по смыслу (структура, hook, формулировки — не факты продукта)
alter table public.forge_knowledge_base
  add column if not exists reference_sites jsonb not null default '[]'::jsonb;

comment on column public.forge_knowledge_base.reference_sites is
  'Массив { id, url, label, note, scraped_text, meaning_notes, added_at } — референсы для копирайта';
