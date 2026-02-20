import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Payment {
  id: string;
  estimate_id: string;
  amount: number;
  currency: string;
  method: string | null;
  recipient: string | null;
  reference: string | null;
  receipt_url: string | null;
  status: string;
  verified: boolean | null;
  verified_by: string | null;
  fees: number | null;
  gross_amount: number | null;
  net_amount: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePayments(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["payments", estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("estimate_id", estimateId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Payment[];
    },
    enabled: !!estimateId,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payment: {
      estimate_id: string;
      amount: number;
      currency?: string;
      method?: string;
      recipient?: string;
      reference?: string;
      receipt_url?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("payments")
        .insert({
          ...payment,
          currency: payment.currency || "RUB_PMR",
          status: "pending",
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payments", data.estimate_id] });
      queryClient.invalidateQueries({ queryKey: ["estimate", data.estimate_id] });
      toast({ title: "Платёж создан" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      // Get payment
      const { data: payment, error: fetchErr } = await supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();
      if (fetchErr) throw fetchErr;

      // IDEMPOTENCY: if already confirmed, skip
      if (payment.status === "confirmed") {
        return payment;
      }

      // Update payment status
      const { error: updateErr } = await supabase
        .from("payments")
        .update({
          status: "confirmed",
          verified: true,
          verified_by: user?.id,
        })
        .eq("id", paymentId);
      if (updateErr) throw updateErr;

      // Check if finance_entry already exists (double idempotency guard)
      const { data: existingFE } = await supabase
        .from("finance_entries")
        .select("id")
        .eq("payment_id", payment.id)
        .eq("type", "income")
        .limit(1);

      if (!existingFE || existingFE.length === 0) {
        // Auto-create finance_entry
        const { error: finErr } = await supabase
          .from("finance_entries")
          .insert({
            type: "income",
            amount: payment.amount,
            currency: payment.currency,
            source: "estimate_payment",
            description: `Оплата по смете`,
            estimate_id: payment.estimate_id,
            payment_id: payment.id,
            created_by: user?.id,
            gross_amount: payment.amount,
            net_amount: payment.amount - (payment.fees || 0),
            fees: payment.fees || 0,
          });
        if (finErr) throw finErr;
      }

      // Update estimate paid_amount
      const { data: allPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("estimate_id", payment.estimate_id)
        .eq("status", "confirmed");

      const totalPaid = (allPayments || []).reduce((sum: number, p: any) => sum + p.amount, 0);

      await supabase
        .from("estimates")
        .update({ paid_amount: totalPaid })
        .eq("id", payment.estimate_id);

      // Create notification for managers
      await createPaymentNotification(payment.estimate_id, payment.amount, user?.id);

      return payment;
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ["payments", payment.estimate_id] });
      queryClient.invalidateQueries({ queryKey: ["estimate", payment.estimate_id] });
      queryClient.invalidateQueries({ queryKey: ["finance-entries"] });
      toast({ title: "Платёж подтверждён", description: "Запись в финансовом учёте создана автоматически" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useRefundPayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: payment, error: fetchErr } = await supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();
      if (fetchErr) throw fetchErr;

      if (payment.status === "refunded") {
        throw new Error("Платёж уже возвращён");
      }

      // Mark payment as refunded
      const { error: updateErr } = await supabase
        .from("payments")
        .update({ status: "refunded" })
        .eq("id", paymentId);
      if (updateErr) throw updateErr;

      // Create storno finance_entry (expense)
      const { error: finErr } = await supabase
        .from("finance_entries")
        .insert({
          type: "expense",
          amount: payment.amount,
          currency: payment.currency,
          source: "refund",
          description: `Возврат: ${reason || "без причины"}`,
          estimate_id: payment.estimate_id,
          payment_id: payment.id,
          created_by: user?.id,
          reason: reason || null,
          gross_amount: payment.amount,
          net_amount: payment.amount,
          fees: 0,
        });
      if (finErr) throw finErr;

      // Recalculate paid_amount
      const { data: allPayments } = await supabase
        .from("payments")
        .select("amount")
        .eq("estimate_id", payment.estimate_id)
        .eq("status", "confirmed");

      const totalPaid = (allPayments || []).reduce((sum: number, p: any) => sum + p.amount, 0);

      await supabase
        .from("estimates")
        .update({ paid_amount: totalPaid })
        .eq("id", payment.estimate_id);

      // Audit
      await supabase.from("estimate_history").insert({
        estimate_id: payment.estimate_id,
        action: "payment_refunded",
        changed_by: user?.id || null,
        old_values: { status: "confirmed", amount: payment.amount } as any,
        new_values: { status: "refunded", reason } as any,
      });

      return payment;
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ["payments", payment.estimate_id] });
      queryClient.invalidateQueries({ queryKey: ["estimate", payment.estimate_id] });
      queryClient.invalidateQueries({ queryKey: ["finance-entries"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast({ title: "Возврат выполнен", description: "Создана запись расхода (сторно)" });
    },
    onError: (error) => {
      toast({ title: "Ошибка возврата", description: error.message, variant: "destructive" });
    },
  });
}

// Helper: create notification for payment confirmation
async function createPaymentNotification(estimateId: string, amount: number, userId?: string) {
  try {
    // Get estimate info
    const { data: estimate } = await supabase
      .from("estimates")
      .select("estimate_number, client_name, created_by")
      .eq("id", estimateId)
      .single();

    if (!estimate) return;

    // Notify the estimate creator (manager)
    const targetUserId = estimate.created_by;
    if (!targetUserId || targetUserId === userId) return;

    await supabase.from("notifications").insert({
      user_id: targetUserId,
      type: "payment_confirmed",
      title: `Платёж подтверждён — ${estimate.estimate_number}`,
      message: `${amount.toLocaleString("ru-RU")} ₽ по смете ${estimate.client_name}`,
      link: `/estimator/${estimateId}`,
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}
