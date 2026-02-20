import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Estimate, LineItem, LineItemPreset, calculateLineTotal } from "@/types/estimator";
import { useToast } from "@/hooks/use-toast";

export function useEstimates() {
  return useQuery({
    queryKey: ["estimates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as unknown as Estimate[];
    },
  });
}

export function useEstimate(id: string | undefined) {
  return useQuery({
    queryKey: ["estimate", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: estimate, error } = await supabase
        .from("estimates")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      if (!estimate) return null;

      const { data: lineItems, error: lineError } = await supabase
        .from("estimate_line_items")
        .select("*")
        .eq("estimate_id", id)
        .order("position", { ascending: true });
      
      if (lineError) throw lineError;

      return {
        ...estimate,
        line_items: lineItems,
      } as unknown as Estimate;
    },
    enabled: !!id,
  });
}

export function useLineItemPresets() {
  return useQuery({
    queryKey: ["line-item-presets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("line_item_presets")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data as unknown as LineItemPreset[];
    },
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (estimate: Partial<Estimate>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const insertData = {
        client_name: estimate.client_name || "Новый клиент",
        client_email: estimate.client_email,
        client_phone: estimate.client_phone,
        client_address: estimate.client_address,
        title: estimate.title,
        currency: estimate.currency || "RUB_PMR",
        request_id: estimate.request_id,
        valid_until: estimate.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        created_by: user?.id,
      };

      const { data, error } = await supabase
        .from("estimates")
        .insert(insertData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as Estimate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: "Смета создана" });
    },
    onError: (error) => {
      toast({ 
        title: "Ошибка при создании сметы", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateEstimate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Estimate> & { id: string }) => {
      const { data, error } = await supabase
        .from("estimates")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as Estimate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["estimate", data.id] });
    },
    onError: (error) => {
      toast({ 
        title: "Ошибка при обновлении сметы", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteEstimate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("estimates")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: "Смета удалена" });
    },
    onError: (error) => {
      toast({ 
        title: "Ошибка при удалении сметы", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

export function useAddLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ estimateId, item }: { estimateId: string; item: Partial<LineItem> }) => {
      // Get max position
      const { data: existing } = await supabase
        .from("estimate_line_items")
        .select("position")
        .eq("estimate_id", estimateId)
        .order("position", { ascending: false })
        .limit(1);
      
      const nextPosition = (existing?.[0]?.position ?? -1) + 1;

      const { data, error } = await supabase
        .from("estimate_line_items")
        .insert({
          estimate_id: estimateId,
          position: nextPosition,
          item_type: item.item_type || "service",
          item_code: item.item_code,
          description: item.description || "Новая позиция",
          unit: item.unit || "шт",
          quantity: item.quantity ?? 1,
          unit_price: item.unit_price ?? 0,
          labor_hours: item.labor_hours ?? 0,
          labor_rate: item.labor_rate ?? 0,
          cost_price: item.cost_price ?? 0,
          markup_pct: item.markup_pct ?? 0,
          discount_pct: item.discount_pct ?? 0,
          tax_pct: item.tax_pct ?? 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as LineItem;
    },
    onSuccess: (_, { estimateId }) => {
      queryClient.invalidateQueries({ queryKey: ["estimate", estimateId] });
    },
  });
}

export function useUpdateLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estimateId, ...updates }: Partial<LineItem> & { id: string; estimateId: string }) => {
      const { data, error } = await supabase
        .from("estimate_line_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return { data: data as unknown as LineItem, estimateId };
    },
    onMutate: async ({ id, estimateId, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ["estimate", estimateId] });
      const previous = queryClient.getQueryData(["estimate", estimateId]);
      
      queryClient.setQueryData(["estimate", estimateId], (old: any) => {
        if (!old?.line_items) return old;
        return {
          ...old,
          line_items: old.line_items.map((li: any) =>
            li.id === id
              ? { ...li, ...updates, line_total: calculateLineTotal({ ...li, ...updates }) }
              : li
          ),
        };
      });
      
      return { previous, estimateId };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["estimate", ctx.estimateId], ctx.previous);
      }
    },
    onSettled: (_data: any, _err: any, _vars: any, ctx: any) => {
      if (ctx?.estimateId) {
        queryClient.invalidateQueries({ queryKey: ["estimate", ctx.estimateId] });
      }
    },
  });
}

export function useDeleteLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estimateId }: { id: string; estimateId: string }) => {
      const { error } = await supabase
        .from("estimate_line_items")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return estimateId;
    },
    onMutate: async ({ id, estimateId }) => {
      await queryClient.cancelQueries({ queryKey: ["estimate", estimateId] });
      const previous = queryClient.getQueryData(["estimate", estimateId]);
      
      queryClient.setQueryData(["estimate", estimateId], (old: any) => {
        if (!old?.line_items) return old;
        return {
          ...old,
          line_items: old.line_items.filter((li: any) => li.id !== id),
        };
      });
      
      return { previous, estimateId };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["estimate", ctx.estimateId], ctx.previous);
      }
    },
    onSettled: (_data: any, _err: any, _vars: any, ctx: any) => {
      if (ctx?.estimateId) {
        queryClient.invalidateQueries({ queryKey: ["estimate", ctx.estimateId] });
      }
    },
  });
}

export function useAddFromPreset() {
  const addLineItem = useAddLineItem();

  return useMutation({
    mutationFn: async ({ estimateId, preset }: { estimateId: string; preset: LineItemPreset }) => {
      return addLineItem.mutateAsync({
        estimateId,
        item: {
          item_type: preset.item_type,
          item_code: preset.item_code,
          description: preset.description,
          unit: preset.unit,
          quantity: preset.quantity,
          unit_price: preset.unit_price,
          labor_hours: preset.labor_hours,
          labor_rate: preset.labor_rate,
          cost_price: preset.cost_price,
          markup_pct: preset.markup_pct,
        },
      });
    },
  });
}
