import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CompanyAccount {
  id: string;
  name: string;
  type: "cash" | "bank" | "card";
  balance: number;
  currency: string;
  created_at: string;
}

export function useCompanyAccounts() {
  return useQuery({
    queryKey: ["company-accounts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("company_accounts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as CompanyAccount[];
    },
  });
}

export function useCreateCompanyAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      name: string;
      type: "cash" | "bank" | "card";
      currency?: string;
      balance?: number;
    }) => {
      const { data, error } = await (supabase as any)
        .from("company_accounts")
        .insert({
          name: payload.name,
          type: payload.type,
          currency: payload.currency || "RUB_PMR",
          balance: payload.balance || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CompanyAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-accounts"] });
      toast({ title: "Счёт создан" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}
