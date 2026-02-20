
-- Phase 1a: Extend enums and existing tables

-- Add super_admin to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Add immutable, assigned_by, assigned_at to user_roles
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS immutable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_by uuid,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz DEFAULT now();

-- Add source and address to requests
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS address text;
