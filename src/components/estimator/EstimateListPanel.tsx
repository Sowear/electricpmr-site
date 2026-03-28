import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { FileText, Search, ExternalLink } from "lucide-react";
import { Estimate } from "@/types/estimator";

const EstimateListPanel = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: estimates, isLoading } = useQuery({
    queryKey: ["all-estimates", search],
    queryFn: async () => {
      let query = supabase
        .from("estimates")
        .select("id, estimate_number, title, client_name, status, total, created_at, project_id")
        .order("created_at", { ascending: false })
        .limit(100);

      if (search) {
        query = query.or(
          `estimate_number.ilike.%${search}%,title.ilike.%${search}%,client_name.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Estimate[];
    },
  });

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "Черновик", color: "bg-blue-100 text-blue-800" },
    sent: { label: "Отправлено", color: "bg-amber-100 text-amber-800" },
    viewed: { label: "Просмотрено", color: "bg-purple-100 text-purple-800" },
    approved: { label: "Согласовано", color: "bg-emerald-100 text-emerald-800" },
    pending_prepayment: { label: "Ожидает предоплату", color: "bg-orange-100 text-orange-800" },
    prepayment_received: { label: "Предоплата получена", color: "bg-teal-100 text-teal-800" },
    in_progress: { label: "В работе", color: "bg-amber-100 text-amber-800" },
    completed: { label: "Завершено", color: "bg-green-100 text-green-800" },
    closed: { label: "Закрыто", color: "bg-gray-100 text-gray-800" },
    rejected: { label: "Отклонено", color: "bg-destructive/20 text-destructive" },
    converted: { label: "Конвертировано", color: "bg-violet-100 text-violet-800" },
  };

  const filteredEstimates = useMemo(() => {
    if (!search) return estimates || [];
    const term = search.toLowerCase();
    return (estimates || []).filter(est => 
      est.estimate_number.toLowerCase().includes(term) ||
      est.title?.toLowerCase().includes(term) ||
      est.client_name.toLowerCase().includes(term)
    );
  }, [estimates, search]);

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-sm">Все сметы</h2>
          <Badge variant="outline" className="text-xs">
            {(estimates || []).length}
          </Badge>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по номеру, названию, клиенту..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredEstimates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Сметы не найдены</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredEstimates.map((estimate) => {
            const statusInfo = statusLabels[estimate.status] || statusLabels.draft;
            return (
              <div 
                key={estimate.id} 
                className="border rounded-md p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/estimator/${estimate.id}`)}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm font-semibold truncate">{estimate.estimate_number}</p>
                      <Badge variant="secondary" className={`text-xs ${statusInfo.color}`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                    <p className="text-sm truncate">{estimate.title || "Без названия"}</p>
                    <p className="text-xs text-muted-foreground truncate">{estimate.client_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {Number(estimate.total || 0).toLocaleString("ru-RU")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(estimate.created_at), "d MMM yyyy", { locale: ru })}
                    </p>
                    <Button variant="ghost" size="sm" className="h-7 px-2 mt-1">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EstimateListPanel;