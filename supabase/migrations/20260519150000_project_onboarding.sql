-- Онбординг после квиза: состояние шагов и завершение
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS onboarding_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN public.projects.onboarding_state IS 'JSON: currentStep, routeSteps, quickWinScenarioId, skipped/completed flags';
COMMENT ON COLUMN public.projects.onboarding_completed_at IS 'Когда пользователь завершил или пропустил онбординг';
