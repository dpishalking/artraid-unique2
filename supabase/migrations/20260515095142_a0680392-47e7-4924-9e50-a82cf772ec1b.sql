
-- Feedback from users on each audit
CREATE TABLE public.audit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.analysis_logs(id) ON DELETE CASCADE,
  nps smallint CHECK (nps IS NULL OR (nps BETWEEN 1 AND 10)),
  thumb text CHECK (thumb IS NULL OR thumb IN ('up','down')),
  comment text,
  block_ratings jsonb,
  implemented boolean NOT NULL DEFAULT false,
  result_metric text,
  user_agent text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_feedback_audit_id ON public.audit_feedback(audit_id);
CREATE INDEX idx_audit_feedback_created_at ON public.audit_feedback(created_at DESC);

ALTER TABLE public.audit_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON public.audit_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "No client read"
  ON public.audit_feedback FOR SELECT
  USING (false);

-- LLM self-critique results
CREATE TABLE public.audit_critiques (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.analysis_logs(id) ON DELETE CASCADE,
  score smallint,
  issues jsonb,
  missing jsonb,
  raw jsonb,
  attempt smallint NOT NULL DEFAULT 1,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_critiques_audit_id ON public.audit_critiques(audit_id);

ALTER TABLE public.audit_critiques ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client insert"
  ON public.audit_critiques FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No client read"
  ON public.audit_critiques FOR SELECT
  USING (false);

-- Track prompt version + inline critique snapshot on the log row
ALTER TABLE public.analysis_logs
  ADD COLUMN IF NOT EXISTS prompt_version text,
  ADD COLUMN IF NOT EXISTS critique_score smallint,
  ADD COLUMN IF NOT EXISTS rerun_count smallint NOT NULL DEFAULT 0;
