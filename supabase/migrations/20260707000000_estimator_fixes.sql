-- Recalculate estimate totals: update deposit_amount and global_discount_amount
CREATE OR REPLACE FUNCTION public.recalculate_estimate_totals(p_estimate_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_subtotal DECIMAL;
  v_global_discount DECIMAL;
  v_tax_base DECIMAL;
  v_tax_amount DECIMAL;
  v_total DECIMAL;
  v_deposit DECIMAL;
  v_balance DECIMAL;
  v_estimate RECORD;
BEGIN
  SELECT * INTO v_estimate FROM public.estimates WHERE id = p_estimate_id;
  
  SELECT COALESCE(SUM(line_total), 0) INTO v_subtotal 
  FROM public.estimate_line_items 
  WHERE estimate_id = p_estimate_id;
  
  v_global_discount := GREATEST(
    v_subtotal * COALESCE(v_estimate.global_discount_pct, 0) / 100,
    COALESCE(v_estimate.global_discount_amount, 0)
  );
  
  v_tax_base := v_subtotal - v_global_discount;
  v_tax_amount := v_tax_base * COALESCE(v_estimate.global_tax_pct, 0) / 100;
  v_total := v_tax_base + v_tax_amount + COALESCE(v_estimate.extra_fees, 0);
  
  v_deposit := GREATEST(
    v_total * COALESCE(v_estimate.deposit_pct, 0) / 100,
    COALESCE(v_estimate.deposit_amount, 0)
  );
  
  v_balance := v_total - v_deposit;
  
  UPDATE public.estimates SET
    subtotal = ROUND(v_subtotal, 2),
    tax_amount = ROUND(v_tax_amount, 2),
    total = ROUND(v_total, 2),
    deposit_amount = ROUND(v_deposit, 2),
    global_discount_amount = ROUND(v_global_discount, 2),
    balance_due = ROUND(v_balance, 2),
    updated_at = now()
  WHERE id = p_estimate_id;
END;
$$;

-- Confirm payment RPC: auto-confirm prepayment and transition status if threshold is met
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

  UPDATE public.estimates
  SET 
    paid_amount = v_total_paid,
    prepayment_confirmed = CASE 
      WHEN v_total_paid >= v_threshold THEN true 
      ELSE prepayment_confirmed 
    END,
    prepayment_confirmed_at = CASE 
      WHEN v_total_paid >= v_threshold AND prepayment_confirmed = false THEN now() 
      ELSE prepayment_confirmed_at 
    END,
    prepayment_confirmed_by = CASE 
      WHEN v_total_paid >= v_threshold AND prepayment_confirmed = false THEN p_actor_id 
      ELSE prepayment_confirmed_by 
    END,
    status = CASE 
      WHEN v_total_paid >= v_threshold AND status = 'pending_prepayment' THEN 'prepayment_received'::public.estimate_status 
      ELSE status 
    END
  WHERE id = v_payment.estimate_id;

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
