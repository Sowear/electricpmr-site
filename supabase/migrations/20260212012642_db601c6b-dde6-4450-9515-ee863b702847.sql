
-- Phase 1b: Create new tables and RLS

-- ============================================================
-- NOTES TABLE (client_comment, internal_note, system)
-- ============================================================
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('project','estimate','request')),
  entity_id uuid NOT NULL,
  author_id uuid,
  author_role text,
  note_type text NOT NULL DEFAULT 'internal_note' CHECK (note_type IN ('client_comment','internal_note','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage notes"
  ON public.notes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Technicians can view non-internal notes"
  ON public.notes FOR SELECT
  USING (has_role(auth.uid(), 'technician'::app_role) AND note_type != 'internal_note');

-- ============================================================
-- PAYMENTS TABLE
-- ============================================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'RUB_PMR',
  method text,
  recipient text,
  reference text,
  receipt_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected','refunded')),
  gross_amount numeric DEFAULT 0,
  fees numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  verified boolean DEFAULT false,
  verified_by uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage payments"
  ON public.payments FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- ============================================================
-- FINANCE_ENTRIES TABLE
-- ============================================================
CREATE TABLE public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income','expense')),
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('estimate','manual','import','system')),
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'RUB_PMR',
  gross_amount numeric DEFAULT 0,
  fees numeric DEFAULT 0,
  net_amount numeric DEFAULT 0,
  converted_amount numeric,
  exchange_rate numeric,
  project_id uuid,
  estimate_id uuid REFERENCES public.estimates(id),
  payment_id uuid REFERENCES public.payments(id),
  tags_json jsonb DEFAULT '[]'::jsonb,
  description text,
  receipt_url text,
  reason text,
  approved_by uuid,
  requires_approval boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and managers can manage finance"
  ON public.finance_entries FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text,
  message text,
  payload_json jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread','read','archived')),
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- ============================================================
-- Add paid_amount to estimates
-- ============================================================
ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS client_comment text,
  ADD COLUMN IF NOT EXISTS locked boolean DEFAULT false;

-- ============================================================
-- Trigger for updated_at on new tables
-- ============================================================
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_entries_updated_at
  BEFORE UPDATE ON public.finance_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
