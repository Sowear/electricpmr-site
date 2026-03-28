-- Phase 3: project workspace + finance model refactor

-- ---------------------------------------------------------------------------
-- Safety and baseline constraints
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'finance_entries_source_check'
  ) THEN
    ALTER TABLE public.finance_entries DROP CONSTRAINT finance_entries_source_check;
  END IF;
END $$;

ALTER TABLE public.finance_entries
  ADD CONSTRAINT finance_entries_source_check
  CHECK (source IN ('estimate', 'estimate_payment', 'manual', 'import', 'refund', 'system'));

-- ---------------------------------------------------------------------------
-- Extend projects and estimates/payments/finance linkage
-- ---------------------------------------------------------------------------

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS object_id uuid;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS object_id uuid,
  ADD COLUMN IF NOT EXISTS project_id uuid,
  ADD COLUMN IF NOT EXISTS account_id uuid,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_by uuid;

ALTER TABLE public.finance_entries
  ADD COLUMN IF NOT EXISTS object_id uuid;

-- ---------------------------------------------------------------------------
-- New enums
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
    CREATE TYPE public.member_role AS ENUM ('manager', 'technician', 'organizer');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_type') THEN
    CREATE TYPE public.payout_type AS ENUM ('percent_profit', 'percent_revenue', 'fixed', 'hybrid');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
    CREATE TYPE public.account_type AS ENUM ('cash', 'bank', 'card');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
    CREATE TYPE public.payout_status AS ENUM ('pending', 'paid');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- New tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.project_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  address text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  object_id uuid REFERENCES public.project_objects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.member_role NOT NULL,
  payout_type public.payout_type NOT NULL DEFAULT 'percent_profit',
  fixed_amount numeric NOT NULL DEFAULT 0,
  percent_share numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, object_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS public.company_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type public.account_type NOT NULL,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'RUB_PMR',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profit_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id uuid REFERENCES public.project_objects(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  revenue numeric NOT NULL DEFAULT 0,
  expenses numeric NOT NULL DEFAULT 0,
  net_profit numeric NOT NULL DEFAULT 0,
  reserve_amount numeric NOT NULL DEFAULT 0,
  distributable_amount numeric NOT NULL DEFAULT 0,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  locked boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.object_profit_distribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_id uuid NOT NULL REFERENCES public.profit_snapshots(id) ON DELETE CASCADE,
  object_id uuid REFERENCES public.project_objects(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_type public.payout_type NOT NULL,
  percent numeric,
  fixed_amount numeric,
  calculated_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employee_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  object_id uuid REFERENCES public.project_objects(id) ON DELETE SET NULL,
  snapshot_id uuid REFERENCES public.profit_snapshots(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  status public.payout_status NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  user_id uuid,
  user_role text,
  diff_json jsonb,
  reason text,
  ip text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Foreign keys for object/project linkage
-- ---------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'estimates_object_id_fkey'
      AND table_name = 'estimates'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.estimates
      ADD CONSTRAINT estimates_object_id_fkey
      FOREIGN KEY (object_id) REFERENCES public.project_objects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_object_id_fkey'
      AND table_name = 'payments'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_object_id_fkey
      FOREIGN KEY (object_id) REFERENCES public.project_objects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_project_id_fkey'
      AND table_name = 'payments'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_account_id_fkey'
      AND table_name = 'payments'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES public.company_accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'finance_entries_object_id_fkey'
      AND table_name = 'finance_entries'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.finance_entries
      ADD CONSTRAINT finance_entries_object_id_fkey
      FOREIGN KEY (object_id) REFERENCES public.project_objects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_project_objects_project_id ON public.project_objects(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_object ON public.project_members(project_id, object_id);
CREATE INDEX IF NOT EXISTS idx_estimates_project_object ON public.estimates(project_id, object_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_object_status ON public.payments(project_id, object_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_entries_project_object ON public.finance_entries(project_id, object_id, type);
CREATE INDEX IF NOT EXISTS idx_profit_snapshots_project_object_created ON public.profit_snapshots(project_id, object_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_payouts_user_status ON public.employee_payouts(user_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_income_by_payment ON public.finance_entries(payment_id, type) WHERE type = 'income';
CREATE UNIQUE INDEX IF NOT EXISTS uq_profit_snapshot_period ON public.profit_snapshots(object_id, period_start, period_end);

-- ---------------------------------------------------------------------------
-- RLS setup
-- ---------------------------------------------------------------------------

ALTER TABLE public.project_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.object_profit_distribution ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/managers can manage project objects"
  ON public.project_objects FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Technicians can read project objects"
  ON public.project_objects FOR SELECT
  USING (has_role(auth.uid(), 'technician'::app_role));

CREATE POLICY "Admins/managers can manage project members"
  ON public.project_members FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can read own project membership"
  ON public.project_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage company accounts"
  ON public.company_accounts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers/admins can read snapshots"
  ON public.profit_snapshots FOR SELECT
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers/admins can create snapshots"
  ON public.profit_snapshots FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers/admins can read distributions"
  ON public.object_profit_distribution FOR SELECT
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Users can read own payouts"
  ON public.employee_payouts FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers/admins can manage payouts"
  ON public.employee_payouts FOR ALL
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Only admins can read audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers/admins can write audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- ---------------------------------------------------------------------------
-- Updated_at triggers
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS update_project_objects_updated_at ON public.project_objects;
CREATE TRIGGER update_project_objects_updated_at
  BEFORE UPDATE ON public.project_objects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Super admin immutability baseline (if user exists)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  vlad_user_id uuid;
BEGIN
  SELECT p.user_id
  INTO vlad_user_id
  FROM public.profiles p
  WHERE p.phone = '+37377746642'
     OR p.user_id IN (
       SELECT id FROM auth.users WHERE email = 'mmxxnon@gmail.com'
     )
  LIMIT 1;

  IF vlad_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, immutable, assigned_at)
    VALUES (vlad_user_id, 'super_admin'::app_role, true, now())
    ON CONFLICT (user_id, role)
    DO UPDATE SET immutable = true, assigned_at = now();
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Snapshot calculation and idempotent payment confirm pipeline
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_profit_snapshot_for_object(
  p_object_id uuid,
  p_actor_id uuid DEFAULT auth.uid(),
  p_reserve_percent numeric DEFAULT 10,
  p_period_start timestamptz DEFAULT date_trunc('month', now()),
  p_period_end timestamptz DEFAULT now()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id uuid;
  v_snapshot_id uuid;
  v_revenue numeric := 0;
  v_expenses numeric := 0;
  v_net_profit numeric := 0;
  v_reserve numeric := 0;
  v_distributable numeric := 0;
  m record;
  v_calc numeric := 0;
BEGIN
  SELECT project_id INTO v_project_id FROM public.project_objects WHERE id = p_object_id;
  IF v_project_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(SUM(amount), 0)
    INTO v_revenue
  FROM public.finance_entries
  WHERE object_id = p_object_id
    AND type = 'income'
    AND created_at >= p_period_start
    AND created_at <= p_period_end;

  SELECT COALESCE(SUM(amount), 0)
    INTO v_expenses
  FROM public.finance_entries
  WHERE object_id = p_object_id
    AND type = 'expense'
    AND created_at >= p_period_start
    AND created_at <= p_period_end;

  v_net_profit := v_revenue - v_expenses;
  v_reserve := CASE WHEN v_net_profit > 0 THEN floor(v_net_profit * (p_reserve_percent / 100.0)) ELSE 0 END;
  v_distributable := GREATEST(v_net_profit - v_reserve, 0);

  INSERT INTO public.profit_snapshots (
    object_id,
    project_id,
    revenue,
    expenses,
    net_profit,
    reserve_amount,
    distributable_amount,
    period_start,
    period_end,
    locked
  )
  VALUES (
    p_object_id,
    v_project_id,
    v_revenue,
    v_expenses,
    v_net_profit,
    v_reserve,
    v_distributable,
    p_period_start,
    p_period_end,
    true
  )
  ON CONFLICT (object_id, period_start, period_end)
  DO UPDATE SET
    revenue = EXCLUDED.revenue,
    expenses = EXCLUDED.expenses,
    net_profit = EXCLUDED.net_profit,
    reserve_amount = EXCLUDED.reserve_amount,
    distributable_amount = EXCLUDED.distributable_amount,
    locked = true
  RETURNING id INTO v_snapshot_id;

  DELETE FROM public.object_profit_distribution WHERE snapshot_id = v_snapshot_id;
  DELETE FROM public.employee_payouts WHERE snapshot_id = v_snapshot_id;

  FOR m IN
    SELECT *
    FROM public.project_members
    WHERE project_id = v_project_id
      AND (object_id = p_object_id OR object_id IS NULL)
  LOOP
    v_calc := 0;

    IF m.payout_type = 'percent_profit' THEN
      v_calc := v_distributable * COALESCE(m.percent_share, 0) / 100.0;
    ELSIF m.payout_type = 'percent_revenue' THEN
      v_calc := v_revenue * COALESCE(m.percent_share, 0) / 100.0;
    ELSIF m.payout_type = 'fixed' THEN
      v_calc := COALESCE(m.fixed_amount, 0);
    ELSIF m.payout_type = 'hybrid' THEN
      v_calc := COALESCE(m.fixed_amount, 0) + (v_distributable * COALESCE(m.percent_share, 0) / 100.0);
    END IF;

    INSERT INTO public.object_profit_distribution (
      snapshot_id,
      object_id,
      user_id,
      payout_type,
      percent,
      fixed_amount,
      calculated_amount
    )
    VALUES (
      v_snapshot_id,
      p_object_id,
      m.user_id,
      m.payout_type,
      m.percent_share,
      m.fixed_amount,
      GREATEST(v_calc, 0)
    );

    INSERT INTO public.employee_payouts (
      user_id,
      project_id,
      object_id,
      snapshot_id,
      amount,
      status
    )
    VALUES (
      m.user_id,
      v_project_id,
      p_object_id,
      v_snapshot_id,
      GREATEST(v_calc, 0),
      'pending'
    );
  END LOOP;

  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    user_role,
    diff_json,
    reason
  )
  VALUES (
    'profit_snapshot',
    v_snapshot_id,
    'created',
    p_actor_id,
    'manager',
    jsonb_build_object(
      'object_id', p_object_id,
      'revenue', v_revenue,
      'expenses', v_expenses,
      'distributable', v_distributable
    ),
    'payment_confirmed_or_manual'
  );

  RETURN v_snapshot_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_payment_and_generate_finance(
  p_payment_id uuid,
  p_actor_id uuid DEFAULT auth.uid(),
  p_snapshot_threshold numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_estimate public.estimates%ROWTYPE;
  v_total_paid numeric := 0;
  v_snapshot_id uuid;
  v_already boolean := false;
BEGIN
  IF NOT (
    has_role(p_actor_id, 'manager'::app_role)
    OR has_role(p_actor_id, 'admin'::app_role)
    OR has_role(p_actor_id, 'super_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_payment
  FROM public.payments
  WHERE id = p_payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  SELECT * INTO v_estimate FROM public.estimates WHERE id = v_payment.estimate_id;

  IF v_payment.status = 'confirmed' THEN
    v_already := true;
  ELSE
    UPDATE public.payments
    SET
      status = 'confirmed',
      verified = true,
      verified_by = p_actor_id,
      confirmed_by = p_actor_id,
      confirmed_at = now(),
      project_id = COALESCE(v_payment.project_id, v_estimate.project_id),
      object_id = COALESCE(v_payment.object_id, v_estimate.object_id),
      updated_at = now()
    WHERE id = p_payment_id;
  END IF;

  INSERT INTO public.finance_entries (
    type,
    source,
    amount,
    currency,
    project_id,
    object_id,
    estimate_id,
    payment_id,
    created_by,
    gross_amount,
    fees,
    net_amount,
    description
  )
  VALUES (
    'income',
    'estimate_payment',
    v_payment.amount,
    v_payment.currency,
    COALESCE(v_payment.project_id, v_estimate.project_id),
    COALESCE(v_payment.object_id, v_estimate.object_id),
    v_payment.estimate_id,
    v_payment.id,
    p_actor_id,
    COALESCE(v_payment.gross_amount, v_payment.amount),
    COALESCE(v_payment.fees, 0),
    COALESCE(v_payment.net_amount, v_payment.amount - COALESCE(v_payment.fees, 0)),
    'Оплата по смете'
  )
  ON CONFLICT (payment_id, type) WHERE type = 'income'
  DO NOTHING;

  SELECT COALESCE(SUM(amount), 0)
    INTO v_total_paid
  FROM public.payments
  WHERE estimate_id = v_payment.estimate_id
    AND status = 'confirmed';

  UPDATE public.estimates
  SET paid_amount = v_total_paid
  WHERE id = v_payment.estimate_id;

  IF COALESCE(v_payment.object_id, v_estimate.object_id) IS NOT NULL
     AND v_total_paid >= p_snapshot_threshold THEN
    v_snapshot_id := public.create_profit_snapshot_for_object(
      COALESCE(v_payment.object_id, v_estimate.object_id),
      p_actor_id
    );
  END IF;

  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    user_role,
    diff_json,
    reason
  )
  VALUES (
    'payment',
    v_payment.id,
    CASE WHEN v_already THEN 'confirm_idempotent' ELSE 'confirmed' END,
    p_actor_id,
    'manager',
    jsonb_build_object(
      'estimate_id', v_payment.estimate_id,
      'amount', v_payment.amount,
      'project_id', COALESCE(v_payment.project_id, v_estimate.project_id),
      'object_id', COALESCE(v_payment.object_id, v_estimate.object_id),
      'snapshot_id', v_snapshot_id
    ),
    'api_confirm_payment'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', v_already,
    'payment_id', v_payment.id,
    'estimate_id', v_payment.estimate_id,
    'snapshot_id', v_snapshot_id,
    'paid_amount', v_total_paid
  );
END;
$$;
