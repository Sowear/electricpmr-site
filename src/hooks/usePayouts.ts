import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EmployeePayout {
  id: string;
  user_id: string;
  project_id: string | null;
  object_id: string | null;
  snapshot_id: string | null;
  amount: number;
  status: "pending" | "paid";
  paid_at?: string | null;
  reference?: string | null;
  created_at: string;
}

export function useProjectPayouts(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-payouts", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await (supabase as any)
        .from("employee_payouts")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EmployeePayout[];
    },
    enabled: !!projectId,
  });
}

export function useMarkPayoutPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ payoutId, accountId, reference }: { payoutId: string; accountId: string; reference?: string }) => {
      const { data, error } = await (supabase as any).rpc("mark_employee_payout_paid", {
        p_payout_id: payoutId,
        p_account_id: accountId,
        p_reference: reference || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-entries"] });
      queryClient.invalidateQueries({ queryKey: ["company-accounts"] });
      toast({ title: "Выплата отмечена как оплаченная" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useBatchMarkPayoutsPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ payoutIds, accountId, reference }: { payoutIds: string[]; accountId: string; reference?: string }) => {
      const { data, error } = await (supabase as any).rpc("batch_mark_employee_payouts_paid", {
        p_payout_ids: payoutIds,
        p_account_id: accountId,
        p_reference: reference || null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["finance-entries"] });
      queryClient.invalidateQueries({ queryKey: ["company-accounts"] });
      toast({ title: "Batch выплата выполнена" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function exportPayoutsCSV(rows: EmployeePayout[]) {
  const BOM = "\uFEFF";
  const header = "Дата,Сотрудник,Проект,Объект,Сумма,Статус\n";
  const body = rows
    .map((r) => `${new Date(r.created_at).toLocaleDateString("ru-RU")},${r.user_id},${r.project_id || ""},${r.object_id || ""},${r.amount},${r.status}`)
    .join("\n");
  const blob = new Blob([BOM + header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `payouts_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
