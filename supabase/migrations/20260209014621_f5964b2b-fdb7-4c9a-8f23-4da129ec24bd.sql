
-- 1. Add new roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'technician';

-- 2. Add new estimate statuses
ALTER TYPE public.estimate_status ADD VALUE IF NOT EXISTS 'pending_prepayment';
ALTER TYPE public.estimate_status ADD VALUE IF NOT EXISTS 'prepayment_received';
ALTER TYPE public.estimate_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.estimate_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.estimate_status ADD VALUE IF NOT EXISTS 'closed';

-- 3. Add payment and prepayment fields to estimates
ALTER TABLE public.estimates 
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_recipient text,
  ADD COLUMN IF NOT EXISTS prepayment_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS prepayment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS prepayment_confirmed_by uuid;
