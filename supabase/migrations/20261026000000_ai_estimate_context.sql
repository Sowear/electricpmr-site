-- Persist the structured inspection context that produced an AI-assisted estimate.
-- Existing estimates are untouched and remain valid without a context record.
CREATE TABLE IF NOT EXISTS public.estimate_ai_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL UNIQUE REFERENCES public.estimates(id) ON DELETE CASCADE,
  description text NOT NULL,
  inspection jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.estimate_ai_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers can manage AI estimate context"
  ON public.estimate_ai_context FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
  );

CREATE TRIGGER update_estimate_ai_context_updated_at
BEFORE UPDATE ON public.estimate_ai_context
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_estimate_ai_context_estimate_id
  ON public.estimate_ai_context(estimate_id);
