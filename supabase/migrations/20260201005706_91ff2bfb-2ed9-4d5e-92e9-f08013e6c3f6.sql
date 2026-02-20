-- Fix 1: Create a public view for estimates that excludes sensitive client data
-- This view will be used for public access via public_token

CREATE VIEW public.estimates_public
WITH (security_invoker=on) AS
  SELECT 
    id,
    estimate_number,
    title,
    client_name,
    -- Exclude: client_email, client_phone, client_address (sensitive PII)
    currency,
    exchange_rate,
    global_discount_pct,
    global_discount_amount,
    global_tax_pct,
    extra_fees,
    extra_fees_description,
    public_token,
    deposit_pct,
    deposit_amount,
    subtotal,
    tax_amount,
    total,
    balance_due,
    valid_until,
    payment_due_date,
    status,
    notes,
    created_at,
    updated_at,
    sent_at,
    viewed_at,
    approved_at
  FROM public.estimates
  WHERE public_token IS NOT NULL AND public_token <> '';

-- Drop the old permissive public policy on estimates
DROP POLICY IF EXISTS "Public can view estimates with valid token" ON public.estimates;

-- Create a more restrictive policy - public can only access via the view
-- Direct table access requires authentication
CREATE POLICY "Authenticated users can view estimates with valid token"
  ON public.estimates FOR SELECT
  USING (
    (public_token IS NOT NULL AND public_token <> '' AND auth.uid() IS NOT NULL)
    OR (created_by = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Fix 2: Profiles table already has proper RLS policies
-- But let's verify the policies are restrictive enough
-- The current policies allow:
-- - Users can view their own profile (auth.uid() = user_id)
-- - Admins can view all profiles (has_role(auth.uid(), 'admin'))
-- This is correct - no public access is allowed