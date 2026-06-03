-- Направления лендинга внутри продукта (отёки, варикоз, сон, суставы…)
alter table public.forge_knowledge_base
  add column if not exists directions jsonb not null default '[]'::jsonb;

comment on column public.forge_knowledge_base.directions is
  'Массив { id, slug, title, description, kb overlay, updated_at } — тематические слои поверх общей базы';

-- Привязка прототипа к направлению
alter table public.forge_prototypes
  add column if not exists direction_slug text;

comment on column public.forge_prototypes.direction_slug is
  'slug направления из forge_knowledge_base.directions; null = только общая база';
