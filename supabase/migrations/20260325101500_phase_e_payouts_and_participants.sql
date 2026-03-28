-- Phase E: estimate participants, payouts UI support, finance settings

-- ---------------------------------------------------------------------------
-- Estimate participants
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.estimate_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  project_member_id uuid REFERENCES public.project_members(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  object_id uuid REFERENCES public.project_objects(id) ON DELETE SET NULL,
  role public.member_role NOT NULL,
  payout_type public.payout_type NOT NULL,
  percent_share numeric NOT NULL DEFAULT 0,
  fixed_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_estimate_participant
  ON public.estimate_participants (estimate_id, user_id, role);

CREATE INDEX IF NOT EXISTS idx_estimate_participants_estimate
  ON public.estimate_participants (estimate_id);

ALTER TABLE public.estimate_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers/admins can manage estimate participants"
  ON public.estimate_participants FOR ALL
  USING (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Technicians can read estimate participants"
  ON public.estimate_participants FOR SELECT
  USING (has_role(auth.uid(), 'technician'::app_role));

-- ---------------------------------------------------------------------------
-- Finance settings
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.finance_settings (
  id boolean PRIMARY KEY DEFAULT true,
  reserve_percent numeric NOT NULL DEFAULT 10,
  auto_lock_snapshot boolean NOT NULL DEFAULT true,
  auto_create_payouts boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = true)
);

INSERT INTO public.finance_settings (id, reserve_percent, auto_lock_snapshot, auto_create_payouts)
VALUES (true, 10, true, true)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage finance settings"
  ON public.finance_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Managers can read finance settings"
  ON public.finance_settings FOR SELECT
  USING (has_role(auth.uid(), 'manager'::app_role));

DROP TRIGGER IF EXISTS update_finance_settings_updated_at ON public.finance_settings;
CREATE TRIGGER update_finance_settings_updated_at
  BEFORE UPDATE ON public.finance_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Payment account requirements and payout linkage
-- ---------------------------------------------------------------------------

ALTER TABLE public.finance_entries
  ADD COLUMN IF NOT EXISTS payout_id uuid REFERENCES public.employee_payouts(id) ON DELETE SET NULL;

ALTER TABLE public.estimates
  ADD COLUMN IF NOT EXISTS snapshot_threshold_rule text NOT NULL DEFAULT 'deposit';

CREATE UNIQUE INDEX IF NOT EXISTS uq_finance_expense_by_payout
  ON public.finance_entries (payout_id, type)
  WHERE payout_id IS NOT NULL AND type = 'expense';

CREATE OR REPLACE FUNCTION public.enforce_payment_account_required()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.account_id IS NULL THEN
    RAISE EXCEPTION 'account_id is required for payments';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payments_require_account ON public.payments;
CREATE TRIGGER trg_payments_require_account
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_payment_account_required();

-- ---------------------------------------------------------------------------
-- Participants helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_estimate_participants_from_object(
  p_estimate_id uuid,
  p_actor_id uuid DEFAULT auth.uid()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_estimate public.estimates%ROWTYPE;
  v_count integer := 0;
BEGIN
  IF NOT (
    has_role(p_actor_id, 'manager'::app_role)
    OR has_role(p_actor_id, 'admin'::app_role)
    OR has_role(p_actor_id, 'super_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_estimate FROM public.estimates WHERE id = p_estimate_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estimate not found';
  END IF;

  IF v_estimate.object_id IS NULL THEN
    RETURN 0;
  END IF;

  DELETE FROM public.estimate_participants
  WHERE estimate_id = p_estimate_id
    AND project_member_id IS NOT NULL;

  INSERT INTO public.estimate_participants (
    estimate_id,
    project_member_id,
    user_id,
    object_id,
    role,
    payout_type,
    percent_share,
    fixed_amount
  )
  SELECT
    p_estimate_id,
    pm.id,
    pm.user_id,
    v_estimate.object_id,
    pm.role,
    pm.payout_type,
    pm.percent_share,
    pm.fixed_amount
  FROM public.project_members pm
  WHERE pm.project_id = v_estimate.project_id
    AND (pm.object_id = v_estimate.object_id OR pm.object_id IS NULL)
  ON CONFLICT (estimate_id, user_id, role)
  DO UPDATE SET
    project_member_id = EXCLUDED.project_member_id,
    object_id = EXCLUDED.object_id,
    payout_type = EXCLUDED.payout_type,
    percent_share = EXCLUDED.percent_share,
    fixed_amount = EXCLUDED.fixed_amount;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_estimate_participants(
  p_estimate_id uuid,
  p_payload jsonb,
  p_replace boolean DEFAULT false,
  p_actor_id uuid DEFAULT auth.uid()
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item jsonb;
  v_count integer := 0;
BEGIN
  IF NOT (
    has_role(p_actor_id, 'manager'::app_role)
    OR has_role(p_actor_id, 'admin'::app_role)
    OR has_role(p_actor_id, 'super_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF p_replace THEN
    DELETE FROM public.estimate_participants WHERE estimate_id = p_estimate_id;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(p_payload)
  LOOP
    INSERT INTO public.estimate_participants (
      estimate_id,
      user_id,
      object_id,
      role,
      payout_type,
      percent_share,
      fixed_amount
    )
    VALUES (
      p_estimate_id,
      (item->>'user_id')::uuid,
      NULLIF(item->>'object_id', '')::uuid,
      (item->>'role')::public.member_role,
      (item->>'payout_type')::public.payout_type,
      COALESCE((item->>'percent_share')::numeric, 0),
      COALESCE((item->>'fixed_amount')::numeric, 0)
    )
    ON CONFLICT (estimate_id, user_id, role)
    DO UPDATE SET
      object_id = EXCLUDED.object_id,
      payout_type = EXCLUDED.payout_type,
      percent_share = EXCLUDED.percent_share,
      fixed_amount = EXCLUDED.fixed_amount;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- ---------------------------------------------------------------------------
-- Payout mark paid functions (single + batch)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_employee_payout_paid(
  p_payout_id uuid,
  p_account_id uuid,
  p_reference text DEFAULT NULL,
  p_actor_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payout public.employee_payouts%ROWTYPE;
  v_entry_id uuid;
BEGIN
  IF NOT (
    has_role(p_actor_id, 'manager'::app_role)
    OR has_role(p_actor_id, 'admin'::app_role)
    OR has_role(p_actor_id, 'super_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_payout
  FROM public.employee_payouts
  WHERE id = p_payout_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout not found';
  END IF;

  IF v_payout.status = 'paid' THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'payout_id', v_payout.id);
  END IF;

  UPDATE public.employee_payouts
  SET
    status = 'paid',
    paid_at = now(),
    reference = COALESCE(p_reference, reference)
  WHERE id = p_payout_id;

  INSERT INTO public.finance_entries (
    type,
    source,
    amount,
    currency,
    project_id,
    object_id,
    payout_id,
    created_by,
    description
  )
  VALUES (
    'expense',
    'manual',
    v_payout.amount,
    'RUB_PMR',
    v_payout.project_id,
    v_payout.object_id,
    v_payout.id,
    p_actor_id,
    'Выплата сотруднику'
  )
  ON CONFLICT (payout_id, type) WHERE type = 'expense'
  DO NOTHING
  RETURNING id INTO v_entry_id;

  UPDATE public.company_accounts
  SET balance = balance - v_payout.amount
  WHERE id = p_account_id;

  INSERT INTO public.audit_logs (
    entity_type,
    entity_id,
    action,
    user_id,
    user_role,
    diff_json,
    reason
  ) VALUES (
    'employee_payout',
    v_payout.id,
    'paid',
    p_actor_id,
    'manager',
    jsonb_build_object('amount', v_payout.amount, 'finance_entry_id', v_entry_id, 'account_id', p_account_id),
    'manual_mark_paid'
  );

  RETURN jsonb_build_object('ok', true, 'idempotent', false, 'payout_id', v_payout.id, 'finance_entry_id', v_entry_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.batch_mark_employee_payouts_paid(
  p_payout_ids uuid[],
  p_account_id uuid,
  p_reference text DEFAULT NULL,
  p_actor_id uuid DEFAULT auth.uid()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_done integer := 0;
BEGIN
  FOREACH v_id IN ARRAY p_payout_ids
  LOOP
    PERFORM public.mark_employee_payout_paid(v_id, p_account_id, p_reference, p_actor_id);
    v_done := v_done + 1;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'processed', v_done);
END;
$$;

-- ---------------------------------------------------------------------------
-- Replace payment confirm function with threshold + account movement
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.confirm_payment_and_generate_finance(
  p_payment_id uuid,
  p_actor_id uuid DEFAULT auth.uid(),
  p_snapshot_threshold numeric DEFAULT NULL
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
  v_threshold numeric := 0;
  v_rule text := 'deposit';
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

  IF v_payment.account_id IS NULL THEN
    RAISE EXCEPTION 'Payment account is required';
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

    UPDATE public.company_accounts
    SET balance = balance + v_payment.amount
    WHERE id = v_payment.account_id;
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

  IF p_snapshot_threshold IS NOT NULL THEN
    v_threshold := p_snapshot_threshold;
  ELSE
    v_rule := COALESCE(v_estimate.snapshot_threshold_rule, 'deposit');
    IF v_rule = 'full' THEN
      v_threshold := COALESCE(v_estimate.total, 0);
    ELSE
      v_threshold := GREATEST(
        COALESCE(v_estimate.deposit_amount, 0),
        COALESCE(v_estimate.total, 0) * COALESCE(v_estimate.deposit_pct, 0) / 100.0
      );
    END IF;
  END IF;

  IF COALESCE(v_payment.object_id, v_estimate.object_id) IS NOT NULL
     AND v_total_paid >= v_threshold THEN
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
      'snapshot_id', v_snapshot_id,
      'threshold', v_threshold
    ),
    'api_confirm_payment'
  );

  RETURN jsonb_build_object(
    'ok', true,
    'idempotent', v_already,
    'payment_id', v_payment.id,
    'estimate_id', v_payment.estimate_id,
    'snapshot_id', v_snapshot_id,
    'paid_amount', v_total_paid,
    'threshold', v_threshold
  );
END;
$$;
