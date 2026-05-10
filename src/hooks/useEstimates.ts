import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { Estimate, LineItem, LineItemPreset, calculateLineTotal } from "@/types/estimator";
import { useToast } from "@/hooks/use-toast";

type CatalogItemRow = Tables<"catalog_items">;
type CatalogItemInsert = TablesInsert<"catalog_items">;
type CatalogItemUpdate = TablesUpdate<"catalog_items">;
type EstimateRow = Tables<"estimates">;
type EstimateInsert = TablesInsert<"estimates">;
type EstimateUpdate = TablesUpdate<"estimates">;
type EstimateLineItemRow = Tables<"estimate_line_items">;
type EstimateLineItemInsert = TablesInsert<"estimate_line_items">;
type EstimateLineItemUpdate = TablesUpdate<"estimate_line_items">;
type QueryContext = { previous: EstimateCache | undefined; estimateId: string };

type CatalogItemInput = {
  name: string;
  description: string;
  unit: string;
  base_price: number;
  market_min?: number | null;
  market_max?: number | null;
  category: string;
  tags?: string[];
  synonyms?: string[];
  complexity?: "low" | "medium" | "high";
  popularity_score?: number;
  calc_default?: string;
  special_type?: "height_markup" | "dismantle_percent" | "emergency_contract" | null;
};

type LineItemInput = Partial<LineItem> & {
  catalog_item_id?: string | null;
  comment?: string;
};

const normalizeCategoryKey = (value: string | null | undefined) => {
  if (!value) return "other";
  const v = value.toLowerCase();
  if (v.includes("розет")) return "sockets";
  if (v.includes("освещ") || v.includes("свет")) return "lighting";
  if (v.includes("кабел") || v.includes("провод") || v.includes("штроб")) return "cable";
  if (v.includes("щит") || v.includes("зазем") || v.includes("ввод")) return "panels";
  if (v.includes("улиц") || v.includes("фасад") || v.includes("транше")) return "outdoor";
  if (v.includes("дополн") || v.includes("авар") || v.includes("демонтаж") || v.includes("высот")) return "additional";
  return "other";
};

const jsonArrayToStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const mapCatalogRowToPreset = (row: CatalogItemRow): LineItemPreset => ({
  id: row.id,
  name: row.name,
  item_type: row.special_type ? "other" : "service",
  item_code: undefined,
  description: row.description || row.name,
  unit: row.unit || "шт",
  quantity: 1,
  unit_price: row.base_price ?? 0,
  base_price: row.base_price ?? 0,
  labor_hours: 0,
  labor_rate: 0,
  cost_price: 0,
  markup_pct: 0,
  category: row.category,
  category_key: normalizeCategoryKey(row.category),
  tags: jsonArrayToStringArray(row.tags),
  synonyms: jsonArrayToStringArray(row.synonyms),
  keywords: [...jsonArrayToStringArray(row.tags), ...jsonArrayToStringArray(row.synonyms)],
  complexity: row.complexity === "high" || row.complexity === "medium" ? row.complexity : "low",
  popularity_score: row.popularity_score ?? 0,
  popular: (row.popularity_score ?? 0) >= 8,
  market_min: row.market_min,
  market_max: row.market_max,
  special_type:
    row.special_type === "height_markup" || row.special_type === "dismantle_percent" || row.special_type === "emergency_contract"
      ? row.special_type
      : undefined,
  calc_default: row.calc_default || "piece",
  source: "custom",
  is_active: !row.is_hidden,
});

const calculateEstimateTotals = (estimate: Estimate, lineItems: LineItem[]) => {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.line_total || 0), 0);
  const globalDiscountPct = estimate.global_discount_pct || 0;
  const globalDiscountAmount = estimate.global_discount_amount || 0;
  const globalTaxPct = estimate.global_tax_pct || 0;
  const extraFees = estimate.extra_fees || 0;
  const depositPct = estimate.deposit_pct || 0;
  const depositAmount = estimate.deposit_amount || 0;

  const globalDiscount = Math.max(subtotal * (globalDiscountPct / 100), globalDiscountAmount);
  const taxBase = subtotal - globalDiscount;
  const taxAmount = taxBase * (globalTaxPct / 100);
  const total = taxBase + taxAmount + extraFees;
  const deposit = Math.max(total * (depositPct / 100), depositAmount);
  const balanceDue = total - deposit;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    deposit_amount: Math.round(deposit * 100) / 100,
    balance_due: Math.round(balanceDue * 100) / 100,
  };
};

const mapEstimateRow = (row: EstimateRow): Estimate => row as unknown as Estimate;
const mapLineItemRow = (row: EstimateLineItemRow): LineItem => {
  const item = row as unknown as LineItem;
  return {
    ...item,
    line_total: typeof item.line_total === 'number' ? item.line_total : calculateLineTotal(item)
  };
};

export function useEstimates() {
  return useQuery({
    queryKey: ["estimates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapEstimateRow);
    },
  });
}

export function useProjectEstimates(projectId: string | undefined, objectId?: string) {
  return useQuery({
    queryKey: ["project-estimates", projectId, objectId || "all"],
    queryFn: async () => {
      if (!projectId) return [] as Estimate[];

      const { data, error } = objectId
        ? await supabase
            .from("estimates")
            .select("*")
            .eq("project_id", projectId)
            .eq("object_id", objectId)
            .order("created_at", { ascending: false })
        : await supabase
            .from("estimates")
            .select("*")
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(mapEstimateRow);
    },
    enabled: !!projectId,
  });
}

export function useEstimate(id: string | undefined) {
  return useQuery({
    queryKey: ["estimate", id],
    queryFn: async () => {
      if (!id) return null;

      const { data: estimate, error } = await supabase
        .from("estimates")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!estimate) return null;

      const { data: lineItems, error: lineError } = await supabase
        .from("estimate_line_items")
        .select("*")
        .eq("estimate_id", id)
        .order("position", { ascending: true });

      if (lineError) throw lineError;

      return {
        ...mapEstimateRow(estimate),
        line_items: (lineItems || []).map(mapLineItemRow),
      };
    },
    enabled: !!id,
  });
}

import { defaultCatalogItems } from "@/data/catalog";

const LS_CATALOG_KEY = "estimate_catalog_items";

const getLocalCatalog = (): LineItemPreset[] => {
  if (typeof window === "undefined") return defaultCatalogItems;
  try {
    const raw = window.localStorage.getItem(LS_CATALOG_KEY);
    if (!raw) return defaultCatalogItems;
    return JSON.parse(raw);
  } catch {
    return defaultCatalogItems;
  }
};

const saveLocalCatalog = (items: LineItemPreset[]) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LS_CATALOG_KEY, JSON.stringify(items));
  }
};

export function useLineItemPresets() {
  return useQuery({
    queryKey: ["line-item-presets"],
    queryFn: async () => {
      const items = getLocalCatalog();
      return items.filter(item => item.is_active !== false);
    },
  });
}

export function useHiddenLineItemPresets() {
  return useQuery({
    queryKey: ["line-item-presets", "hidden"],
    queryFn: async () => {
      const items = getLocalCatalog();
      return items.filter(item => item.is_active === false);
    },
  });
}

export function useCreateCatalogItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (item: CatalogItemInput) => {
      if (!item.name.trim()) throw new Error("Название позиции обязательно");
      if (item.base_price < 0) throw new Error("Цена не может быть отрицательной");

      const marketMin = item.market_min ?? Math.round(item.base_price * 0.7);
      const marketMax = item.market_max ?? Math.round(item.base_price * 1.3);

      const newItem: LineItemPreset = {
        id: "cat-item-" + Date.now(),
        name: item.name.trim(),
        description: item.description,
        item_type: "service",
        unit: item.unit,
        quantity: 1,
        unit_price: item.base_price,
        base_price: item.base_price,
        labor_hours: 0,
        labor_rate: 0,
        cost_price: 0,
        markup_pct: 0,
        market_min: marketMin,
        market_max: marketMax,
        category: item.category,
        category_key: normalizeCategoryKey(item.category),
        tags: item.tags || [],
        synonyms: item.synonyms || [],
        keywords: [...(item.tags || []), ...(item.synonyms || [])],
        complexity: item.complexity || "low",
        popularity_score: item.popularity_score || 0,
        popular: (item.popularity_score || 0) >= 8,
        calc_default: item.calc_default || "piece",
        special_type: item.special_type || undefined,
        source: "custom",
        is_active: true
      };

      const catalog = getLocalCatalog();
      saveLocalCatalog([newItem, ...catalog]);
      return newItem.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["line-item-presets"] });
      queryClient.invalidateQueries({ queryKey: ["line-item-presets", "hidden"] });
      toast({ title: "Позиция каталога создана" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CatalogItemInput> & { id: string }) => {
      if (updates.name !== undefined && !updates.name.trim()) {
        throw new Error("Название позиции обязательно");
      }

      const catalog = getLocalCatalog();
      const index = catalog.findIndex(i => i.id === id);
      if (index === -1) throw new Error("Позиция не найдена");

      const item = catalog[index];
      catalog[index] = {
        ...item,
        name: updates.name?.trim() ?? item.name,
        description: updates.description ?? item.description,
        unit: updates.unit ?? item.unit,
        base_price: updates.base_price ?? item.base_price,
        unit_price: updates.base_price ?? item.unit_price,
        market_min: updates.market_min ?? item.market_min,
        market_max: updates.market_max ?? item.market_max,
        category: updates.category ?? item.category,
        category_key: updates.category ? normalizeCategoryKey(updates.category) : item.category_key,
        tags: updates.tags ?? item.tags,
        synonyms: updates.synonyms ?? item.synonyms,
        complexity: updates.complexity ?? item.complexity,
        popularity_score: updates.popularity_score ?? item.popularity_score,
        calc_default: updates.calc_default ?? item.calc_default,
        special_type: updates.special_type ?? item.special_type,
      };

      saveLocalCatalog(catalog);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["line-item-presets"] });
      queryClient.invalidateQueries({ queryKey: ["line-item-presets", "hidden"] });
      toast({ title: "Позиция каталога обновлена" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useHideCatalogItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, hidden }: { id: string; hidden: boolean }) => {
      const catalog = getLocalCatalog();
      const index = catalog.findIndex(i => i.id === id);
      if (index !== -1) {
        catalog[index].is_active = !hidden;
        saveLocalCatalog(catalog);
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["line-item-presets"] });
      queryClient.invalidateQueries({ queryKey: ["line-item-presets", "hidden"] });
      toast({ title: "Статус позиции обновлен" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteCatalogItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const catalog = getLocalCatalog();
      const updatedCatalog = catalog.filter(i => i.id !== id);
      saveLocalCatalog(updatedCatalog);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["line-item-presets"] });
      queryClient.invalidateQueries({ queryKey: ["line-item-presets", "hidden"] });
      toast({ title: "Позиция удалена из каталога" });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

export function useCreateEstimate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (estimate: Partial<Estimate>) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const insertData: EstimateInsert = {
        client_name: estimate.client_name || "Новый клиент",
        client_email: estimate.client_email,
        client_phone: estimate.client_phone,
        client_address: estimate.client_address,
        title: estimate.title,
        currency: estimate.currency || "RUB_PMR",
        request_id: estimate.request_id,
        project_id: estimate.project_id,
        object_id: estimate.object_id || null,
        valid_until: estimate.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        created_by: user?.id,
      };

      const { data, error } = await supabase.from("estimates").insert(insertData).select().single();
      if (error) throw error;
      return mapEstimateRow(data as EstimateRow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: "Смета создана" });
    },
    onError: (error) => {
      toast({ title: "Ошибка при создании сметы", description: error.message, variant: "destructive" });
    },
  });
}

export function useUpdateEstimate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Estimate> & { id: string }) => {
      const payload: EstimateUpdate = updates as EstimateUpdate;
      const { data, error } = await supabase.from("estimates").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return mapEstimateRow(data as EstimateRow);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      queryClient.invalidateQueries({ queryKey: ["estimate", data.id] });
    },
    onError: (error) => {
      toast({ title: "Ошибка при обновлении сметы", description: error.message, variant: "destructive" });
    },
  });
}

export function useDeleteEstimate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estimates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimates"] });
      toast({ title: "Смета удалена" });
    },
    onError: (error) => {
      toast({ title: "Ошибка при удалении сметы", description: error.message, variant: "destructive" });
    },
  });
}

export function useAddLineItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ estimateId, item }: { estimateId: string; item: LineItemInput }) => {
      const description = (item.description || "").trim();
      if (!description) throw new Error("Описание позиции обязательно");

      const quantity = item.quantity ?? 1;
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Количество должно быть больше 0");

      const isContract = (item.unit || "").toLowerCase() === "договорная";
      const rawUnitPrice = item.unit_price ?? 0;
      if (!Number.isFinite(rawUnitPrice) || rawUnitPrice < 0) {
        throw new Error("Недопустимая цена");
      }

      const { data: existing } = await supabase
        .from("estimate_line_items")
        .select("position")
        .eq("estimate_id", estimateId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPosition = (existing?.[0]?.position ?? -1) + 1;

      const payload: EstimateLineItemInsert = {
        estimate_id: estimateId,
        position: nextPosition,
        item_type: item.item_type || "service",
        item_code: item.item_code,
        description,
        unit: item.unit || "шт",
        quantity,
        unit_price: isContract ? 0 : rawUnitPrice,
        labor_hours: item.labor_hours ?? 0,
        labor_rate: item.labor_rate ?? 0,
        cost_price: item.cost_price ?? 0,
        markup_pct: item.markup_pct ?? 0,
        discount_pct: item.discount_pct ?? 0,
        tax_pct: item.tax_pct ?? 0,
      };

      if (item.catalog_item_id) {
        payload.catalog_item_id = item.catalog_item_id;
      }

      if (item.comment?.trim()) {
        payload.comment = item.comment.trim();
      }

      const { data, error } = await supabase.from("estimate_line_items").insert(payload).select().single();

      if (error) throw error;
      return mapLineItemRow(data as EstimateLineItemRow);
    },
    onSuccess: (_, { estimateId }) => {
      queryClient.invalidateQueries({ queryKey: ["estimate", estimateId] });
    },
    onError: (error) => {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    },
  });
}

type EstimateCache = Estimate | null;

export function useUpdateLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estimateId, ...updates }: Partial<LineItem> & { id: string; estimateId: string }) => {
      const payload: EstimateLineItemUpdate = updates as EstimateLineItemUpdate;
      const { data, error } = await supabase.from("estimate_line_items").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return { data: mapLineItemRow(data as EstimateLineItemRow), estimateId };
    },
    onMutate: async ({ id, estimateId, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ["estimate", estimateId] });
      const previous = queryClient.getQueryData<EstimateCache>(["estimate", estimateId]);

      queryClient.setQueryData<EstimateCache>(["estimate", estimateId], (old) => {
        if (!old?.line_items) return old;
        const updatedLineItems = old.line_items.map((li) =>
          li.id === id ? { ...li, ...updates, line_total: calculateLineTotal({ ...li, ...updates }) } : li,
        );
        const totals = calculateEstimateTotals(old, updatedLineItems as LineItem[]);
        return {
          ...old,
          ...totals,
          line_items: updatedLineItems,
        };
      });

      return { previous, estimateId };
    },
    onError: (_err, _vars, ctx: QueryContext | undefined) => {
      if (ctx?.previous) queryClient.setQueryData(["estimate", ctx.estimateId], ctx.previous);
    },
    onSettled: (_data, _err, _vars, ctx: QueryContext | undefined) => {
      if (ctx?.estimateId) queryClient.invalidateQueries({ queryKey: ["estimate", ctx.estimateId] });
    },
  });
}

export function useDeleteLineItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estimateId }: { id: string; estimateId: string }) => {
      const { error } = await supabase.from("estimate_line_items").delete().eq("id", id);
      if (error) throw error;
      return estimateId;
    },
    onMutate: async ({ id, estimateId }) => {
      await queryClient.cancelQueries({ queryKey: ["estimate", estimateId] });
      const previous = queryClient.getQueryData<EstimateCache>(["estimate", estimateId]);

      queryClient.setQueryData<EstimateCache>(["estimate", estimateId], (old) => {
        if (!old?.line_items) return old;
        const updatedLineItems = old.line_items.filter((li) => li.id !== id);
        const totals = calculateEstimateTotals(old, updatedLineItems as LineItem[]);
        return {
          ...old,
          ...totals,
          line_items: updatedLineItems,
        };
      });

      return { previous, estimateId };
    },
    onError: (_err, _vars, ctx: QueryContext | undefined) => {
      if (ctx?.previous) queryClient.setQueryData(["estimate", ctx.estimateId], ctx.previous);
    },
    onSettled: (_data, _err, _vars, ctx: QueryContext | undefined) => {
      if (ctx?.estimateId) queryClient.invalidateQueries({ queryKey: ["estimate", ctx.estimateId] });
    },
  });
}

export function useAddFromPreset() {
  const addLineItem = useAddLineItem();

  return useMutation({
    mutationFn: async ({ estimateId, preset, comment }: { estimateId: string; preset: LineItemPreset; comment?: string }) => {
      return addLineItem.mutateAsync({
        estimateId,
        item: {
          catalog_item_id: preset.id,
          item_type: preset.item_type,
          item_code: preset.item_code,
          description: preset.description,
          comment,
          unit: preset.unit,
          quantity: preset.quantity,
          unit_price: preset.unit_price,
          labor_hours: preset.labor_hours,
          labor_rate: preset.labor_rate,
          cost_price: preset.cost_price,
          markup_pct: preset.markup_pct,
        },
      });
    },
  });
}
