
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.audit_feedback;
CREATE POLICY "No client insert"
  ON public.audit_feedback FOR INSERT
  WITH CHECK (false);
