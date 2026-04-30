import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  title?: string;
  address?: string;
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

export interface ProjectObject {
  id: string;
  project_id: string;
  title: string;
  address?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  object_id?: string | null;
  user_id: string;
  role: "manager" | "technician" | "organizer";
  payout_type: "percent_profit" | "percent_revenue" | "fixed" | "hybrid";
  fixed_amount: number;
  percent_share: number;
  created_at: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_projects_with_counts");

      if (error) throw error;
      return (data || []) as Project[];
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

export function useProjectObjects(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-objects", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_objects")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as ProjectObject[];
    },
    enabled: !!projectId,
  });
}

export function useCreateProjectObject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ projectId, title, address }: { projectId: string; title: string; address?: string }) => {
      const { data, error } = await supabase
        .from("project_objects")
        .insert({
          project_id: projectId,
          title,
          address: address || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectObject;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["project-objects", vars.projectId] });
      toast({ title: "Объект добавлен" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useProjectMembers(projectId: string | undefined, objectId?: string) {
  return useQuery({
    queryKey: ["project-members", projectId, objectId || "all"],
    queryFn: async () => {
      if (!projectId) return [];

      let query = supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (objectId) {
        query = query.or(`object_id.eq.${objectId},object_id.is.null`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ProjectMember[];
    },
    enabled: !!projectId,
  });
}

export function useUpsertProjectMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      object_id?: string | null;
      user_id: string;
      role: "manager" | "technician" | "organizer";
      payout_type: "percent_profit" | "percent_revenue" | "fixed" | "hybrid";
      fixed_amount?: number;
      percent_share?: number;
    }) => {
      const { data, error } = await supabase
        .from("project_members")
        .upsert({
          ...payload,
          fixed_amount: payload.fixed_amount || 0,
          percent_share: payload.percent_share || 0,
        }, { onConflict: "project_id,object_id,user_id,role" })
        .select()
        .single();

      if (error) throw error;
      return data as ProjectMember;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project-members", data.project_id] });
      toast({ title: "Участник назначен" });
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
      const { data, error } = await supabase.rpc("duplicate_estimate", {
        p_estimate_id: estimateId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-estimates"] });
      toast({ title: "Новая версия сметы создана" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useProjectKpi(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-kpi", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase.rpc("get_project_kpi", {
        p_project_id: projectId,
      });

      if (error) throw error;
      return data as {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        activeEstimates: number;
        objectsCount: number;
      };
    },
    enabled: !!projectId,
  });
}

export function useDeleteProjectObject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ objectId, projectId }: { objectId: string; projectId: string }) => {
      const { error } = await supabase
        .from("project_objects")
        .delete()
        .eq("id", objectId);

      if (error) throw error;
      return true;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["project-objects", vars.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-kpi", vars.projectId] });
      toast({ title: "Объект удалён" });
    },
    onError: (error) => {
      toast({ title: "Ошибка удаления", description: error.message, variant: "destructive" });
    },
  });
}
