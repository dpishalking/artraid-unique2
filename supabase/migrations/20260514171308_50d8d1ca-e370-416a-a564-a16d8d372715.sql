CREATE TABLE public.analysis_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  original_url TEXT,
  referer TEXT,
  user_agent TEXT,
  ip TEXT,
  audit JSONB,
  status TEXT NOT NULL DEFAULT 'success',
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_logs_created_at ON public.analysis_logs (created_at DESC);

ALTER TABLE public.analysis_logs ENABLE ROW LEVEL SECURITY;

-- Deny all client access. Reads & writes go through edge functions using the service role.
CREATE POLICY "No client read"
ON public.analysis_logs FOR SELECT
USING (false);

CREATE POLICY "No client insert"
ON public.analysis_logs FOR INSERT
WITH CHECK (false);