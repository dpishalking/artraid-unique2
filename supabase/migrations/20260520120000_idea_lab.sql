-- Режим «Проект с нуля» / Idea Lab
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS startup_mode text NOT NULL DEFAULT 'has_business'
    CHECK (startup_mode IN ('has_business', 'has_idea', 'unclear')),
  ADD COLUMN IF NOT EXISTS idea_lab_state jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.projects.startup_mode IS 'has_business | has_idea | unclear — ветка после квиза';
COMMENT ON COLUMN public.projects.idea_lab_state IS 'Диалог Idea Lab: messages, card, stage, clarityPercent';
