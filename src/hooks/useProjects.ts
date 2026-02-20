import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  request_id?: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  source: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  estimates_count?: number;
  latest_estimate_status?: string;
  latest_estimate_total?: number;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as Project | null;
    },
    enabled: !!id,
  });
}

export function useProjectEstimates(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-estimates", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("estimates")
        .select("*")
        .eq("project_id", projectId)
        .order("version", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (project: Partial<Project>) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("projects")
        .insert({
          client_name: project.client_name || "Новый клиент",
          client_phone: project.client_phone,
          client_email: project.client_email,
          client_address: project.client_address,
          source: project.source || "website",
          request_id: project.request_id,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Проект создан" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreateEstimateFromProject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, clientComment }: { projectId: string; clientComment?: string }) => {
      // Get project data
      const { data: project, error: projError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projError) throw projError;

      // Get current max version for this project
      const { data: existing } = await supabase
        .from("estimates")
        .select("version")
        .eq("project_id", projectId)
        .order("version", { ascending: false })
        .limit(1);

      const nextVersion = (existing?.[0]?.version ?? 0) + 1;

      const { data: { user } } = await supabase.auth.getUser();

      const { data: estimate, error } = await supabase
        .from("estimates")
        .insert({
          project_id: projectId,
          client_name: project.client_name,
          client_phone: project.client_phone,
          client_email: project.client_email,
          client_address: project.client_address,
          client_comment: clientComment || null,
          version: nextVersion,
          currency: "RUB_PMR",
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // If there's a client comment, also create a note
      if (clientComment) {
        await supabase.from("notes").insert({
          entity_type: "estimate",
          entity_id: estimate.id,
          content: clientComment,
          note_type: "client_comment",
          author_id: user?.id,
        });
      }

      return estimate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: "Смета создана из проекта" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useDuplicateEstimate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (estimateId: string) => {
      // Fetch original estimate
      const { data: original, error: fetchErr } = await supabase
        .from("estimates")
        .select("*")
        .eq("id", estimateId)
        .single();

      if (fetchErr) throw fetchErr;

      // Fetch line items
      const { data: lineItems } = await supabase
        .from("estimate_line_items")
        .select("*")
        .eq("estimate_id", estimateId)
        .order("position", { ascending: true });

      const { data: { user } } = await supabase.auth.getUser();

      // Get next version
      let nextVersion = (original.version || 1) + 1;
      if (original.project_id) {
        const { data: versions } = await supabase
          .from("estimates")
          .select("version")
          .eq("project_id", original.project_id)
          .order("version", { ascending: false })
          .limit(1);
        nextVersion = ((versions?.[0]?.version as number) ?? 0) + 1;
      }

      // Create new estimate
      const { data: newEstimate, error: createErr } = await supabase
        .from("estimates")
        .insert({
          project_id: original.project_id,
          client_name: original.client_name,
          client_phone: original.client_phone,
          client_email: original.client_email,
          client_address: original.client_address,
          client_comment: original.client_comment,
          title: original.title,
          currency: original.currency,
          global_discount_pct: original.global_discount_pct,
          global_tax_pct: original.global_tax_pct,
          extra_fees: original.extra_fees,
          extra_fees_description: original.extra_fees_description,
          deposit_pct: original.deposit_pct,
          notes: original.notes,
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          payment_method: original.payment_method,
          payment_recipient: original.payment_recipient,
          version: nextVersion,
          status: "draft",
          locked: false,
          created_by: user?.id,
        } as any)
        .select()
        .single();

      if (createErr) throw createErr;

      // Copy line items
      if (lineItems && lineItems.length > 0) {
        const newItems = lineItems.map((li) => ({
          estimate_id: newEstimate.id,
          position: li.position,
          item_type: li.item_type,
          item_code: li.item_code,
          description: li.description,
          unit: li.unit,
          quantity: li.quantity,
          unit_price: li.unit_price,
          labor_hours: li.labor_hours,
          labor_rate: li.labor_rate,
          cost_price: li.cost_price,
          markup_pct: li.markup_pct,
          discount_pct: li.discount_pct,
          tax_pct: li.tax_pct,
        }));

        await supabase.from("estimate_line_items").insert(newItems);
      }

      return newEstimate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Новая версия сметы создана" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}
