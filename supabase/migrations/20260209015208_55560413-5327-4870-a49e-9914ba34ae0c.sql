
-- 1. Update estimates RLS: Allow managers to manage estimates alongside admins
DROP POLICY IF EXISTS "Admins can manage all estimates" ON public.estimates;
CREATE POLICY "Admins and managers can manage all estimates"
  ON public.estimates FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Technicians can view estimates (read-only)
CREATE POLICY "Technicians can view estimates"
  ON public.estimates FOR SELECT
  USING (has_role(auth.uid(), 'technician'::app_role));

-- 2. Update line items RLS for managers
DROP POLICY IF EXISTS "Users can manage line items for accessible estimates" ON public.estimate_line_items;
CREATE POLICY "Users can manage line items for accessible estimates"
  ON public.estimate_line_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM estimates e
    WHERE e.id = estimate_line_items.estimate_id 
    AND (e.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  ));

-- Technicians can view line items (read-only)
CREATE POLICY "Technicians can view line items"
  ON public.estimate_line_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM estimates e
    WHERE e.id = estimate_line_items.estimate_id 
    AND has_role(auth.uid(), 'technician'::app_role)
  ));

-- 3. Allow history inserts from admins/managers
CREATE POLICY "Admins and managers can insert history"
  ON public.estimate_history FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Update history view policy for managers
DROP POLICY IF EXISTS "Users can view history for accessible estimates" ON public.estimate_history;
CREATE POLICY "Users can view history for accessible estimates"
  ON public.estimate_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM estimates e
    WHERE e.id = estimate_history.estimate_id 
    AND (e.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role))
  ));

-- 4. Allow managers to manage presets
DROP POLICY IF EXISTS "Admins can manage presets" ON public.line_item_presets;
CREATE POLICY "Admins and managers can manage presets"
  ON public.line_item_presets FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));
