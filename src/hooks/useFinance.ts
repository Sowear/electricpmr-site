import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinanceEntry {
  id: string;
  type: string;
  amount: number;
  currency: string;
  source: string;
  description: string | null;
  estimate_id: string | null;
  payment_id: string | null;
  project_id: string | null;
  fees: number | null;
  gross_amount: number | null;
  net_amount: number | null;
  created_by: string | null;
  created_at: string;
  receipt_url: string | null;
  reason: string | null;
}

export function useFinanceEntries(filters?: {
  from?: string;
  to?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ["finance-entries", filters],
    queryFn: async () => {
      let query = supabase
        .from("finance_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.from) {
        query = query.gte("created_at", filters.from);
      }
      if (filters?.to) {
        query = query.lte("created_at", filters.to + "T23:59:59");
      }
      if (filters?.type) {
        query = query.eq("type", filters.type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinanceEntry[];
    },
  });
}

export function useFinanceSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: ["finance-summary", from, to],
    queryFn: async () => {
      let query = supabase.from("finance_entries").select("*");

      if (from) query = query.gte("created_at", from);
      if (to) query = query.lte("created_at", to + "T23:59:59");

      const { data, error } = await query;
      if (error) throw error;

      const entries = data || [];
      const income = entries
        .filter((e: any) => e.type === "income")
        .reduce((sum: number, e: any) => sum + e.amount, 0);
      const expenses = entries
        .filter((e: any) => e.type === "expense")
        .reduce((sum: number, e: any) => sum + e.amount, 0);

      return {
        totalIncome: income,
        totalExpenses: expenses,
        netProfit: income - expenses,
        entryCount: entries.length,
      };
    },
  });
}

export function exportFinanceCSV(entries: FinanceEntry[]) {
  const BOM = "\uFEFF";
  const header = "Дата,Тип,Сумма,Валюта,Источник,Описание\n";
  const rows = entries
    .map((e) => {
      const date = new Date(e.created_at).toLocaleDateString("ru-RU");
      const type = e.type === "income" ? "Доход" : "Расход";
      return `${date},${type},${e.amount},${e.currency},${e.source},"${(e.description || "").replace(/"/g, '""')}"`;
    })
    .join("\n");

  const blob = new Blob([BOM + header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `finance_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
