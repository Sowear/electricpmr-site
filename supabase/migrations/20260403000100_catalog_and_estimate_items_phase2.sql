-- Phase 2: Persistent catalog + estimate items mapping + API-ready CRUD

-- 1) Catalog table (normalized and API-friendly)
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'шт',
  base_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  market_min NUMERIC(12,2),
  market_max NUMERIC(12,2),
  category TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
  complexity TEXT NOT NULL DEFAULT 'low',
  popularity_score INTEGER NOT NULL DEFAULT 0,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  calc_default TEXT,
  special_type TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT catalog_items_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT catalog_items_complexity_valid CHECK (complexity IN ('low','medium','high'))
);

ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- View access for authenticated users, full management for admin/manager
DROP POLICY IF EXISTS "Authenticated users can view catalog items" ON public.catalog_items;
CREATE POLICY "Authenticated users can view catalog items"
  ON public.catalog_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins managers can manage catalog items" ON public.catalog_items;
CREATE POLICY "Admins managers can manage catalog items"
  ON public.catalog_items FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'manager'::app_role)
  );

-- 2) Extend estimate line items for API-driven link to catalog
ALTER TABLE public.estimate_line_items
  ADD COLUMN IF NOT EXISTS catalog_item_id UUID REFERENCES public.catalog_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS comment TEXT;

CREATE INDEX IF NOT EXISTS idx_estimate_line_items_catalog_item_id
  ON public.estimate_line_items(catalog_item_id);

-- 3) Sync compatibility view estimate_items expected by API-oriented frontend
CREATE OR REPLACE VIEW public.estimate_items AS
SELECT
  id,
  estimate_id,
  catalog_item_id,
  description AS name,
  quantity,
  unit_price AS price,
  unit,
  line_total AS total,
  comment,
  created_at
FROM public.estimate_line_items;

-- 4) Keep updated_at consistent
DROP TRIGGER IF EXISTS update_catalog_items_updated_at ON public.catalog_items;
CREATE TRIGGER update_catalog_items_updated_at
BEFORE UPDATE ON public.catalog_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Seed catalog from existing line item presets once (idempotent by name)
INSERT INTO public.catalog_items (
  name,
  description,
  unit,
  base_price,
  market_min,
  market_max,
  category,
  tags,
  synonyms,
  complexity,
  popularity_score,
  is_hidden,
  calc_default,
  special_type
)
SELECT
  p.name,
  p.description,
  COALESCE(p.unit, 'шт') AS unit,
  COALESCE(p.unit_price, 0) AS base_price,
  ROUND(COALESCE(p.unit_price, 0) * 0.7, 2) AS market_min,
  ROUND(COALESCE(p.unit_price, 0) * 1.3, 2) AS market_max,
  COALESCE(p.category, 'Прочее') AS category,
  '[]'::jsonb AS tags,
  '[]'::jsonb AS synonyms,
  'low' AS complexity,
  0 AS popularity_score,
  NOT COALESCE(p.is_active, true) AS is_hidden,
  NULL::text AS calc_default,
  NULL::text AS special_type
FROM public.line_item_presets p
WHERE NOT EXISTS (
  SELECT 1 FROM public.catalog_items c WHERE lower(c.name) = lower(p.name)
);

-- 6) Additional indexes
CREATE INDEX IF NOT EXISTS idx_catalog_items_category ON public.catalog_items(category);
CREATE INDEX IF NOT EXISTS idx_catalog_items_hidden ON public.catalog_items(is_hidden);
CREATE INDEX IF NOT EXISTS idx_catalog_items_popularity ON public.catalog_items(popularity_score DESC);
