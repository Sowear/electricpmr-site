-- Create rate_limits table for spam protection
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'request_form',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking)
CREATE POLICY "Allow anonymous rate limit inserts" 
ON public.rate_limits 
FOR INSERT 
WITH CHECK (true);

-- Allow read for rate checking
CREATE POLICY "Allow anonymous rate limit reads" 
ON public.rate_limits 
FOR SELECT 
USING (true);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_ip_action ON public.rate_limits(ip_address, action_type, created_at);

-- Auto-cleanup old rate limit entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits WHERE created_at < now() - INTERVAL '1 hour';
END;
$$;

-- Create estimate statuses enum
CREATE TYPE public.estimate_status AS ENUM ('draft', 'sent', 'viewed', 'approved', 'converted', 'rejected');

-- Create line item types enum
CREATE TYPE public.line_item_type AS ENUM ('material', 'labor', 'service', 'other');

-- Create estimates table
CREATE TABLE public.estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_number TEXT NOT NULL UNIQUE,
  title TEXT,
  status public.estimate_status NOT NULL DEFAULT 'draft',
  
  -- Client info
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  
  -- Linked request/project
  request_id UUID REFERENCES public.requests(id),
  
  -- Currency settings
  currency TEXT NOT NULL DEFAULT 'RUB_PMR',
  exchange_rate DECIMAL(10,4) DEFAULT 1.0,
  
  -- Global settings
  global_discount_pct DECIMAL(5,2) DEFAULT 0,
  global_discount_amount DECIMAL(12,2) DEFAULT 0,
  global_tax_pct DECIMAL(5,2) DEFAULT 0,
  extra_fees DECIMAL(12,2) DEFAULT 0,
  extra_fees_description TEXT,
  
  -- Deposit
  deposit_pct DECIMAL(5,2) DEFAULT 0,
  deposit_amount DECIMAL(12,2) DEFAULT 0,
  
  -- Calculated totals (cached)
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  balance_due DECIMAL(12,2) DEFAULT 0,
  
  -- Dates
  valid_until DATE,
  payment_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Public access
  public_token TEXT UNIQUE,
  
  -- PDF storage
  pdf_url TEXT,
  
  -- Audit
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- CRM integration
  crm_lead_id TEXT,
  crm_synced_at TIMESTAMP WITH TIME ZONE
);

-- Create line items table
CREATE TABLE public.estimate_line_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  
  item_type public.line_item_type NOT NULL DEFAULT 'service',
  item_code TEXT,
  description TEXT NOT NULL,
  unit TEXT DEFAULT 'шт',
  
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Labor specific
  labor_hours DECIMAL(10,2) DEFAULT 0,
  labor_rate DECIMAL(12,2) DEFAULT 0,
  
  -- Cost tracking
  cost_price DECIMAL(12,2) DEFAULT 0,
  
  -- Adjustments
  markup_pct DECIMAL(5,2) DEFAULT 0,
  discount_pct DECIMAL(5,2) DEFAULT 0,
  tax_pct DECIMAL(5,2) DEFAULT 0,
  
  -- Calculated total (cached)
  line_total DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate templates table
CREATE TABLE public.estimate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_data JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create line item presets table
CREATE TABLE public.line_item_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  item_type public.line_item_type NOT NULL DEFAULT 'service',
  item_code TEXT,
  description TEXT NOT NULL,
  unit TEXT DEFAULT 'шт',
  quantity DECIMAL(10,3) DEFAULT 1,
  unit_price DECIMAL(12,2) DEFAULT 0,
  labor_hours DECIMAL(10,2) DEFAULT 0,
  labor_rate DECIMAL(12,2) DEFAULT 0,
  cost_price DECIMAL(12,2) DEFAULT 0,
  markup_pct DECIMAL(5,2) DEFAULT 0,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create estimate history/audit log
CREATE TABLE public.estimate_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT
);

-- Create estimate send log
CREATE TABLE public.estimate_send_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES public.estimates(id) ON DELETE CASCADE,
  sent_to_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  status TEXT DEFAULT 'sent'
);

-- Enable RLS on all tables
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_item_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_send_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for estimates (admin/manager access)
CREATE POLICY "Admins can manage all estimates" 
ON public.estimates 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view estimates they created" 
ON public.estimates 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can create estimates" 
ON public.estimates 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own estimates" 
ON public.estimates 
FOR UPDATE 
USING (created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

-- Public access for viewing with token
CREATE POLICY "Public can view estimates with valid token" 
ON public.estimates 
FOR SELECT 
USING (public_token IS NOT NULL AND public_token != '');

-- RLS for line items (follows estimate access)
CREATE POLICY "Users can manage line items for accessible estimates" 
ON public.estimate_line_items 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.estimates e 
    WHERE e.id = estimate_id 
    AND (e.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

CREATE POLICY "Public can view line items for public estimates" 
ON public.estimate_line_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.estimates e 
    WHERE e.id = estimate_id 
    AND e.public_token IS NOT NULL
  )
);

-- RLS for templates (all authenticated users)
CREATE POLICY "Authenticated users can view templates" 
ON public.estimate_templates 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create templates" 
ON public.estimate_templates 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all templates" 
ON public.estimate_templates 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS for presets (all authenticated users can view)
CREATE POLICY "Authenticated users can view presets" 
ON public.line_item_presets 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage presets" 
ON public.line_item_presets 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS for history (follows estimate access)
CREATE POLICY "Users can view history for accessible estimates" 
ON public.estimate_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.estimates e 
    WHERE e.id = estimate_id 
    AND (e.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- RLS for send log (follows estimate access)
CREATE POLICY "Users can view send log for accessible estimates" 
ON public.estimate_send_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.estimates e 
    WHERE e.id = estimate_id 
    AND (e.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  )
);

-- Create indexes for performance
CREATE INDEX idx_estimates_status ON public.estimates(status);
CREATE INDEX idx_estimates_created_by ON public.estimates(created_by);
CREATE INDEX idx_estimates_public_token ON public.estimates(public_token);
CREATE INDEX idx_estimates_request_id ON public.estimates(request_id);
CREATE INDEX idx_line_items_estimate_id ON public.estimate_line_items(estimate_id);
CREATE INDEX idx_line_items_position ON public.estimate_line_items(estimate_id, position);
CREATE INDEX idx_presets_category ON public.line_item_presets(category);

-- Create trigger for updated_at
CREATE TRIGGER update_estimates_updated_at
BEFORE UPDATE ON public.estimates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estimate_line_items_updated_at
BEFORE UPDATE ON public.estimate_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_estimate_templates_updated_at
BEFORE UPDATE ON public.estimate_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_line_item_presets_updated_at
BEFORE UPDATE ON public.line_item_presets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate estimate number
CREATE OR REPLACE FUNCTION public.generate_estimate_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  today_str TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  today_str := to_char(now(), 'YYYYMMDD');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(estimate_number FROM 'EST-' || today_str || '-(\d+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.estimates
  WHERE estimate_number LIKE 'EST-' || today_str || '-%';
  
  new_number := 'EST-' || today_str || '-' || LPAD(seq_num::TEXT, 3, '0');
  
  RETURN new_number;
END;
$$;

-- Trigger to auto-generate estimate number
CREATE OR REPLACE FUNCTION public.set_estimate_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.estimate_number IS NULL OR NEW.estimate_number = '' THEN
    NEW.estimate_number := public.generate_estimate_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_estimate_number
BEFORE INSERT ON public.estimates
FOR EACH ROW
EXECUTE FUNCTION public.set_estimate_number();

-- Function to generate public token
CREATE OR REPLACE FUNCTION public.generate_public_token()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Insert default presets
INSERT INTO public.line_item_presets (name, item_type, description, unit, quantity, unit_price, labor_hours, labor_rate, markup_pct, category) VALUES
('Установка розетки', 'labor', 'Установка розетки с подключением', 'шт', 1, 50, 0.5, 15, 0, 'Розетки и выключатели'),
('Замена щита', 'service', 'Демонтаж старого и установка нового электрощита', 'шт', 1, 200, 4, 20, 10, 'Электрощиты'),
('Замена проводки (за м.п.)', 'labor', 'Замена электропроводки с штроблением', 'м.п.', 1, 25, 0.3, 15, 5, 'Проводка'),
('Установка люстры', 'labor', 'Монтаж и подключение люстры', 'шт', 1, 30, 0.5, 15, 0, 'Освещение'),
('Установка светильника точечного', 'labor', 'Монтаж точечного светильника', 'шт', 1, 20, 0.3, 15, 0, 'Освещение'),
('Аварийный выезд', 'service', 'Срочный выезд мастера на объект', 'выезд', 1, 100, 0, 0, 0, 'Услуги'),
('Диагностика электросети', 'service', 'Полная диагностика электропроводки', 'услуга', 1, 80, 1, 20, 0, 'Услуги'),
('Установка автомата', 'labor', 'Установка автоматического выключателя', 'шт', 1, 25, 0.25, 15, 0, 'Электрощиты'),
('Установка УЗО', 'labor', 'Установка устройства защитного отключения', 'шт', 1, 35, 0.3, 15, 0, 'Электрощиты'),
('Монтаж кабель-канала', 'labor', 'Прокладка кабель-канала', 'м.п.', 1, 15, 0.15, 15, 0, 'Проводка');

-- Function to calculate line item total
CREATE OR REPLACE FUNCTION public.calculate_line_item_total(
  p_quantity DECIMAL,
  p_unit_price DECIMAL,
  p_labor_hours DECIMAL,
  p_labor_rate DECIMAL,
  p_markup_pct DECIMAL,
  p_discount_pct DECIMAL,
  p_tax_pct DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  line_net DECIMAL;
  labor_cost DECIMAL;
  line_subtotal DECIMAL;
  markup_amount DECIMAL;
  discount_amount DECIMAL;
  tax_amount DECIMAL;
  line_total DECIMAL;
BEGIN
  line_net := COALESCE(p_quantity, 0) * COALESCE(p_unit_price, 0);
  labor_cost := COALESCE(p_labor_hours, 0) * COALESCE(p_labor_rate, 0);
  line_subtotal := line_net + labor_cost;
  markup_amount := line_subtotal * COALESCE(p_markup_pct, 0) / 100;
  discount_amount := (line_subtotal + markup_amount) * COALESCE(p_discount_pct, 0) / 100;
  tax_amount := (line_subtotal + markup_amount - discount_amount) * COALESCE(p_tax_pct, 0) / 100;
  line_total := line_subtotal + markup_amount - discount_amount + tax_amount;
  
  RETURN ROUND(line_total, 2);
END;
$$;

-- Trigger to auto-calculate line item total
CREATE OR REPLACE FUNCTION public.update_line_item_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.line_total := public.calculate_line_item_total(
    NEW.quantity,
    NEW.unit_price,
    NEW.labor_hours,
    NEW.labor_rate,
    NEW.markup_pct,
    NEW.discount_pct,
    NEW.tax_pct
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_calculate_line_item_total
BEFORE INSERT OR UPDATE ON public.estimate_line_items
FOR EACH ROW
EXECUTE FUNCTION public.update_line_item_total();

-- Function to recalculate estimate totals
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
    balance_due = ROUND(v_balance, 2),
    updated_at = now()
  WHERE id = p_estimate_id;
END;
$$;

-- Trigger to recalculate estimate when line items change
CREATE OR REPLACE FUNCTION public.trigger_recalculate_estimate()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_estimate_totals(OLD.estimate_id);
  ELSE
    PERFORM public.recalculate_estimate_totals(NEW.estimate_id);
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_recalc_estimate_on_line_change
AFTER INSERT OR UPDATE OR DELETE ON public.estimate_line_items
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalculate_estimate();