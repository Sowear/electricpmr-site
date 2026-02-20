import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WorkExample {
  id: string;
  title: string;
  description: string | null;
  before_image_url: string;
  after_image_url: string;
  category: string | null;
  tags: string[] | null;
  city: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export function useWorkExamples(publishedOnly = true) {
  return useQuery({
    queryKey: ["work-examples", publishedOnly],
    queryFn: async () => {
      let query = supabase
        .from("work_examples")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (publishedOnly) {
        query = query.eq("is_published", true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as WorkExample[];
    },
  });
}

export function useCreateWorkExample() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (example: Omit<WorkExample, "id" | "created_at" | "updated_at" | "created_by">) => {
      const { data, error } = await supabase
        .from("work_examples")
        .insert(example)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-examples"] });
      toast({ title: "Пример работы добавлен" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Ошибка", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useUpdateWorkExample() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkExample> & { id: string }) => {
      const { data, error } = await supabase
        .from("work_examples")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-examples"] });
      toast({ title: "Пример работы обновлён" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Ошибка", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export function useDeleteWorkExample() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("work_examples")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-examples"] });
      toast({ title: "Пример работы удалён" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Ошибка", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });
}

export async function uploadWorkExampleImage(file: File, folder: "before" | "after"): Promise<string> {
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
  
  if (!fileExt || !allowedExtensions.includes(fileExt)) {
    throw new Error("Разрешены только файлы: jpg, png, webp");
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Максимальный размер файла: 5 МБ");
  }
  
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from("work-examples")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
  
  if (uploadError) throw uploadError;
  
  const { data } = supabase.storage
    .from("work-examples")
    .getPublicUrl(fileName);
  
  return data.publicUrl;
}

export async function deleteWorkExampleImage(url: string): Promise<void> {
  const path = url.split("/work-examples/")[1];
  if (path) {
    await supabase.storage.from("work-examples").remove([path]);
  }
}
