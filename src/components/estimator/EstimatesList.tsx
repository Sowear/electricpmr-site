import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, Search, FileText, Send, Eye, Trash2, MoreHorizontal, Filter
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEstimates, useCreateEstimate, useDeleteEstimate } from "@/hooks/useEstimates";
import { ESTIMATE_STATUSES, CURRENCIES } from "@/types/estimator";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";

const EstimatesList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: estimates, isLoading } = useEstimates();
  const createEstimate = useCreateEstimate();
  const deleteEstimate = useDeleteEstimate();
  const { canManageEstimates, canViewPrices, isTechnician } = useUserRole();
  const isMobile = useIsMobile();

  const filteredEstimates = estimates?.filter((est) => {
    const query = searchQuery.toLowerCase();
    return (
      est.estimate_number.toLowerCase().includes(query) ||
      est.client_name.toLowerCase().includes(query) ||
      est.client_phone?.toLowerCase().includes(query) ||
      est.title?.toLowerCase().includes(query)
    );
  });

  const handleCreateNew = async () => {
    const result = await createEstimate.mutateAsync({});
    if (result) {
      navigate(`/estimator/${result.id}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = ESTIMATE_STATUSES.find(s => s.value === status);
    if (!statusInfo) return null;
    return <Badge className={statusInfo.color}>{statusInfo.label}</Badge>;
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find(c => c.code === code)?.symbol || code;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Сметы</h1>
          <p className="text-muted-foreground">
            {isTechnician ? "Просмотр назначенных смет" : "Управление сметами и расчётами"}
          </p>
        </div>
        {canManageEstimates && (
          <Button onClick={handleCreateNew} disabled={createEstimate.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Новая смета
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по номеру, клиенту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Table */}
      {filteredEstimates && filteredEstimates.length > 0 ? (
        isMobile ? (
          /* Mobile: Card Layout */
          <div className="space-y-2">
            {filteredEstimates.map((estimate) => (
              <div
                key={estimate.id}
                className="border rounded-lg p-3 bg-card active:bg-muted/50 cursor-pointer"
                onClick={() => navigate(`/estimator/${estimate.id}`)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="font-mono text-sm font-medium truncate">{estimate.estimate_number}</span>
                  </div>
                  {getStatusBadge(estimate.status)}
                </div>
                <p className="font-medium text-sm truncate">{estimate.client_name}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(estimate.created_at), "d MMM yyyy", { locale: ru })}
                  </span>
                  {canViewPrices && (
                    <span className="font-semibold text-sm tabular-nums">
                      {estimate.total.toLocaleString("ru-RU")} {getCurrencySymbol(estimate.currency)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop: Table */
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Номер</TableHead>
                  <TableHead>Клиент</TableHead>
                  {canViewPrices && <TableHead>Сумма</TableHead>}
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstimates.map((estimate) => (
                  <TableRow 
                    key={estimate.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/estimator/${estimate.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{estimate.estimate_number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{estimate.client_name}</p>
                        {estimate.client_phone && (
                          <p className="text-sm text-muted-foreground">{estimate.client_phone}</p>
                        )}
                      </div>
                    </TableCell>
                    {canViewPrices && (
                      <TableCell>
                        <span className="font-semibold">
                          {estimate.total.toLocaleString("ru-RU")} {getCurrencySymbol(estimate.currency)}
                        </span>
                      </TableCell>
                    )}
                    <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(estimate.created_at), "d MMM yyyy", { locale: ru })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/estimator/${estimate.id}`);
                          }}>
                            <Eye className="h-4 w-4 mr-2" /> Открыть
                          </DropdownMenuItem>
                          {canManageEstimates && (
                            <>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); }}>
                                <Send className="h-4 w-4 mr-2" /> Отправить
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("Удалить смету?")) {
                                    deleteEstimate.mutate(estimate.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Удалить
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Нет смет</h3>
          <p className="text-muted-foreground mb-4">
            {canManageEstimates ? "Создайте первую смету для клиента" : "Нет назначенных смет"}
          </p>
          {canManageEstimates && (
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" /> Создать смету
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EstimatesList;
