
-- =============================================
-- Phase 2a: projects table + estimates link + audit trigger
-- =============================================

-- 1. Create projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.requests(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  client_address text,
  source text DEFAULT 'website',
  status text NOT NULL DEFAULT 'new',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Admins and managers can manage all projects"
  ON public.projects FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Technicians can view projects"
  ON public.projects FOR SELECT
  USING (has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (created_by = auth.uid());

-- Updated_at trigger for projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add project_id and version to estimates
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
ALTER TABLE public.estimates ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

-- 3. Audit trigger: log estimate status changes to estimate_history
CREATE OR REPLACE FUNCTION public.log_estimate_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.estimate_history (estimate_id, action, changed_by, old_values, new_values)
    VALUES (
      NEW.id,
      'status_change',
      auth.uid(),
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;

  -- Auto-lock on approved
  IF NEW.status = 'approved' AND (OLD.locked IS DISTINCT FROM true) THEN
    NEW.locked := true;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_estimate_status_change
  BEFORE UPDATE OF status ON public.estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.log_estimate_status_change();

-- 4. Audit trigger: log payment creation
CREATE OR REPLACE FUNCTION public.log_payment_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.estimate_history (estimate_id, action, changed_by, old_values, new_values)
  VALUES (
    NEW.estimate_id,
    CASE WHEN TG_OP = 'INSERT' THEN 'payment_created' ELSE 'payment_updated' END,
    auth.uid(),
    CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('status', OLD.status, 'amount', OLD.amount) ELSE NULL END,
    jsonb_build_object('status', NEW.status, 'amount', NEW.amount, 'method', NEW.method)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_audit
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_change();
