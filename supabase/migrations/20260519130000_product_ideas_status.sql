alter table public.product_ideas
  add column if not exists status text not null default 'new'
    check (status in ('new', 'reviewed', 'planned', 'done', 'dismissed')),
  add column if not exists admin_note text;

create index if not exists idx_product_ideas_status on public.product_ideas (status, created_at desc);
