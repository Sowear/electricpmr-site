import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FinanceSettings {
  id: boolean;
  reserve_percent: number;
  auto_lock_snapshot: boolean;
  auto_create_payouts: boolean;
  updated_at: string;
}

export function useFinanceSettings() {
  return useQuery({
    queryKey: ["finance-settings"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("finance_settings")
        .select("*")
        .eq("id", true)
        .single();
      if (error) throw error;
      return data as FinanceSettings;
    },
  });
}

export function useUpdateFinanceSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: Partial<FinanceSettings>) => {
      const { data, error } = await (supabase as any)
        .from("finance_settings")
        .update(payload)
        .eq("id", true)
        .select()
        .single();
      if (error) throw error;
      return data as FinanceSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-settings"] });
      toast({ title: "Настройки сохранены" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}
