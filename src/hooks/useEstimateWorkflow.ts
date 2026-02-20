import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EstimateStatus, Estimate, ALLOWED_TRANSITIONS } from "@/types/estimator";

interface TransitionValidation {
  valid: boolean;
  reason?: string;
}

export function validateTransition(
  estimate: Partial<Estimate>,
  newStatus: EstimateStatus
): TransitionValidation {
  const currentStatus = estimate.status as EstimateStatus;

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    return { valid: false, reason: `Переход из «${currentStatus}» в «${newStatus}» не разрешён` };
  }

  // Can't go to in_progress without prepayment confirmed (if deposit > 0)
  if (newStatus === 'in_progress') {
    if ((estimate.deposit_pct || 0) > 0 && !estimate.prepayment_confirmed) {
      return { valid: false, reason: 'Нельзя начать работу без подтверждения предоплаты. Сначала подтвердите получение предоплаты.' };
    }
    if (!estimate.payment_method) {
      return { valid: false, reason: 'Укажите способ оплаты перед началом работ.' };
    }
    if (!estimate.payment_recipient) {
      return { valid: false, reason: 'Укажите получателя оплаты перед началом работ.' };
    }
  }

  // Can't confirm prepayment without payment fields
  if (newStatus === 'prepayment_received') {
    if (!estimate.payment_method) {
      return { valid: false, reason: 'Укажите способ оплаты для подтверждения предоплаты.' };
    }
    if (!estimate.payment_recipient) {
      return { valid: false, reason: 'Укажите получателя оплаты для подтверждения предоплаты.' };
    }
  }

  return { valid: true };
}

export function getAvailableTransitions(estimate: Partial<Estimate>): EstimateStatus[] {
  const currentStatus = estimate.status as EstimateStatus;
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}

export function useChangeEstimateStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      estimateId,
      newStatus,
      comment,
    }: {
      estimateId: string;
      newStatus: EstimateStatus;
      comment?: string;
    }) => {
      // Fetch current estimate
      const { data: estimate, error: fetchError } = await supabase
        .from("estimates")
        .select("*")
        .eq("id", estimateId)
        .single();

      if (fetchError) throw fetchError;

      // Validate
      const validation = validateTransition(estimate as unknown as Estimate, newStatus);
      if (!validation.valid) {
        throw new Error(validation.reason);
      }

      const oldStatus = estimate.status;

      // Build update
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === 'sent') updateData.sent_at = new Date().toISOString();
      if (newStatus === 'approved') updateData.approved_at = new Date().toISOString();
      if (newStatus === 'prepayment_received') {
        updateData.prepayment_confirmed = true;
        updateData.prepayment_confirmed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("estimates")
        .update(updateData)
        .eq("id", estimateId);

      if (updateError) throw updateError;

      // Audit log
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("estimate_history").insert({
        estimate_id: estimateId,
        action: 'status_change',
        changed_by: user?.id || null,
        old_values: { status: oldStatus } as any,
        new_values: { status: newStatus, comment: comment || null } as any,
      });

      // Create notification for status change
      await createStatusChangeNotification(estimateId, oldStatus, newStatus, user?.id);

      return { estimateId, newStatus };
    },
    onSuccess: ({ estimateId }) => {
      queryClient.invalidateQueries({ queryKey: ["estimate", estimateId] });
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: "Статус обновлён" });
    },
    onError: (error) => {
      toast({
        title: "Ошибка смены статуса",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useConfirmPrepayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (estimateId: string) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("estimates")
        .update({
          prepayment_confirmed: true,
          prepayment_confirmed_at: new Date().toISOString(),
          prepayment_confirmed_by: user?.id,
        })
        .eq("id", estimateId);

      if (error) throw error;

      // Audit log
      await supabase.from("estimate_history").insert({
        estimate_id: estimateId,
        action: 'prepayment_confirmed',
        changed_by: user?.id || null,
        old_values: { prepayment_confirmed: false } as any,
        new_values: { prepayment_confirmed: true } as any,
      });

      return estimateId;
    },
    onSuccess: (estimateId) => {
      queryClient.invalidateQueries({ queryKey: ["estimate", estimateId] });
      toast({ title: "Предоплата подтверждена" });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEstimateHistory(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["estimate-history", estimateId],
    queryFn: async () => {
      if (!estimateId) return [];

      const { data, error } = await supabase
        .from("estimate_history")
        .select("*")
        .eq("estimate_id", estimateId)
        .order("changed_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!estimateId,
  });
}

// Helper: create notification on status change
async function createStatusChangeNotification(
  estimateId: string,
  oldStatus: string,
  newStatus: string,
  userId?: string
) {
  try {
    const { data: estimate } = await supabase
      .from("estimates")
      .select("estimate_number, client_name, created_by")
      .eq("id", estimateId)
      .single();

    if (!estimate) return;

    const STATUS_LABELS: Record<string, string> = {
      draft: "Черновик", sent: "Отправлена", viewed: "Просмотрена",
      approved: "Согласована", pending_prepayment: "Ожидает предоплату",
      prepayment_received: "Предоплата получена", in_progress: "В работе",
      completed: "Завершена", closed: "Закрыта", rejected: "Отклонена",
      converted: "Конвертирована",
    };

    const targetUserId = estimate.created_by;
    if (!targetUserId || targetUserId === userId) return;

    await supabase.from("notifications").insert({
      user_id: targetUserId,
      type: "status_change",
      title: `${estimate.estimate_number}: ${STATUS_LABELS[oldStatus] || oldStatus} → ${STATUS_LABELS[newStatus] || newStatus}`,
      message: `Смета для ${estimate.client_name}`,
      link: `/estimator/${estimateId}`,
    });
  } catch (e) {
    console.error("Failed to create notification:", e);
  }
}
