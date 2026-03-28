import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type EstimateParticipantRole = "manager" | "technician" | "organizer";
export type EstimateParticipantPayout = "percent_profit" | "percent_revenue" | "fixed" | "hybrid";

export interface EstimateParticipant {
  id: string;
  estimate_id: string;
  project_member_id?: string | null;
  user_id: string;
  object_id?: string | null;
  role: EstimateParticipantRole;
  payout_type: EstimateParticipantPayout;
  percent_share: number;
  fixed_amount: number;
  created_at: string;
}

export function useEstimateParticipants(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["estimate-participants", estimateId],
    queryFn: async () => {
      if (!estimateId) return [];
      const { data, error } = await (supabase as any)
        .from("estimate_participants")
        .select("*")
        .eq("estimate_id", estimateId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as EstimateParticipant[];
    },
    enabled: !!estimateId,
  });
}

export function useEstimateParticipantsCount(estimateId: string | undefined) {
  return useQuery({
    queryKey: ["estimate-participants-count", estimateId],
    queryFn: async () => {
      if (!estimateId) return 0;
      const { count, error } = await (supabase as any)
        .from("estimate_participants")
        .select("id", { count: "exact", head: true })
        .eq("estimate_id", estimateId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!estimateId,
  });
}

export function useAssignEstimateParticipants() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      estimateId,
      participants,
      replace,
    }: {
      estimateId: string;
      participants: Array<{
        user_id: string;
        role: EstimateParticipantRole;
        payout_type: EstimateParticipantPayout;
        percent_share?: number;
        fixed_amount?: number;
        object_id?: string | null;
      }>;
      replace?: boolean;
    }) => {
      const { error } = await (supabase as any).rpc("assign_estimate_participants", {
        p_estimate_id: estimateId,
        p_payload: participants,
        p_replace: !!replace,
      });
      if (error) throw error;
      return { estimateId };
    },
    onSuccess: ({ estimateId }) => {
      queryClient.invalidateQueries({ queryKey: ["estimate-participants", estimateId] });
      queryClient.invalidateQueries({ queryKey: ["estimate-participants-count", estimateId] });
      toast({ title: "Участники обновлены" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useRemoveEstimateParticipant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ participantId, estimateId }: { participantId: string; estimateId: string }) => {
      const { error } = await (supabase as any)
        .from("estimate_participants")
        .delete()
        .eq("id", participantId);
      if (error) throw error;
      return { estimateId };
    },
    onSuccess: ({ estimateId }) => {
      queryClient.invalidateQueries({ queryKey: ["estimate-participants", estimateId] });
      queryClient.invalidateQueries({ queryKey: ["estimate-participants-count", estimateId] });
      toast({ title: "Участник удалён" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function usePrefillEstimateParticipantsFromObject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ estimateId }: { estimateId: string }) => {
      const { data, error } = await (supabase as any).rpc("sync_estimate_participants_from_object", {
        p_estimate_id: estimateId,
      });
      if (error) throw error;
      return { estimateId, imported: Number(data || 0) };
    },
    onSuccess: ({ estimateId, imported }) => {
      queryClient.invalidateQueries({ queryKey: ["estimate-participants", estimateId] });
      queryClient.invalidateQueries({ queryKey: ["estimate-participants-count", estimateId] });
      toast({ title: "Участники подтянуты", description: `Добавлено: ${imported}` });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}
