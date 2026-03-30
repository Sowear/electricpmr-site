import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import ProtectedEstimator from "@/components/estimator/ProtectedEstimator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  FileText,
  Loader2,
  Plus,
  Receipt,
  Wallet,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import {
  useCreateProjectObject,
  useProjectObjects,
  useProjects,
  type ProjectObject,
} from "@/hooks/useProjects";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const PROJECT_TABS = [
  {
    value: "overview",
    label: "Обзор",
    tooltip: "Общая информация о проекте, основные показатели и действия",
  },
  {
    value: "objects",
    label: "Объекты",
    tooltip: "Объекты, на которых проводятся работы по данному проекту",
  },
  {
    value: "estimates",
    label: "Сметы",
    tooltip: "Сметы, созданные для данного проекта и связанные с объектами",
  },
  {
    value: "payments",
    label: "Платежи",
    tooltip: "Платежи, поступившие по сметам проекта",
  },
  {
    value: "finance",
    label: "Финансы",
    tooltip: "Финансовые записи: доходы, расходы, прибыль и распределения",
  },
] as const;

const ProjectDetail = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [createObjectOpen, setCreateObjectOpen] = useState(false);
  const [newObject, setNewObject] = useState({ title: "", address: "" });
  const { canManageEstimates, canViewPrices } = useUserRole();

  const { data: projects } = useProjects();
  const project = useMemo(() => projects?.find((p) => p.id === projectId), [projects, projectId]);

  const { data: objects, isLoading: objectsLoading } = useProjectObjects(projectId);
  const createProjectObject = useCreateProjectObject();

  const { data: estimates, isLoading: estimatesLoading } = useQuery({
    queryKey: ["project-estimates", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("estimates")
        .select("id, estimate_number, title, status, total, currency, version, object_id, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["project-payments", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await (supabase as any)
        .from("payments")
        .select("id, amount, currency, status, object_id, estimate_id, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const { data: financeEntries, isLoading: financeLoading } = useQuery({
    queryKey: ["project-finance", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await (supabase as any)
        .from("finance_entries")
        .select("id, type, amount, currency, source, object_id, estimate_id, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const objectNameById = useMemo(() => {
    const map: Record<string, string> = {};
    (objects || []).forEach((obj) => {
      map[obj.id] = obj.title;
    });
    return map;
  }, [objects]);

  const kpi = useMemo(() => {
    const incomes = (financeEntries || []).filter((x: any) => x.type === "income");
    const expenses = (financeEntries || []).filter((x: any) => x.type === "expense");
    const totalRevenue = incomes.reduce((sum: number, x: any) => sum + Number(x.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum: number, x: any) => sum + Number(x.amount || 0), 0);
    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      activeEstimates: (estimates || []).filter((e: any) => e.status !== "rejected").length,
      objectsCount: (objects || []).length,
    };
  }, [financeEntries, estimates, objects]);

  const handleCreateObject = async () => {
    if (!projectId || !newObject.title.trim()) return;
    const created = await createProjectObject.mutateAsync({
      projectId,
      title: newObject.title.trim(),
      address: newObject.address.trim() || undefined,
    });
    if (created) {
      setCreateObjectOpen(false);
      setNewObject({ title: "", address: "" });
    }
  };

  if (!projectId) return null;

  return (
    <Layout>
      <ProtectedEstimator>
        <div className="container-main py-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> К проектам
              </Button>
              <h1 className="text-2xl font-bold">{project?.title || project?.client_name || "Проект"}</h1>
              <p className="text-sm text-muted-foreground">
                {project?.client_name}
                {project?.client_phone ? ` • ${project.client_phone}` : ""}
              </p>
            </div>
            {canManageEstimates && (
              <Button onClick={() => setCreateObjectOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Создать объект
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Объекты</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                      Количество объектов, созданных в этом проекте
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xl font-semibold">{kpi.objectsCount}</p>
            </div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Активные сметы</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                      Количество смет с активным статусом (не отклоненных)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xl font-semibold">{kpi.activeEstimates}</p>
            </div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Выручка</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                      Общая сумма дохода по проекту (подтвержденные платежи)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xl font-semibold text-emerald-600">{kpi.totalRevenue.toLocaleString("ru-RU")}</p>
            </div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Расходы</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                      Общая сумма расходов по проекту (материалы, зарплаты и т.д.)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xl font-semibold text-destructive">{kpi.totalExpenses.toLocaleString("ru-RU")}</p>
            </div>
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Чистая прибыль</p>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                        <Info className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                      Выручка минус расходы (до вычета резерва и налогов)
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xl font-semibold">{kpi.netProfit.toLocaleString("ru-RU")}</p>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="w-full overflow-x-auto flex flex-nowrap gap-1 pb-2">
              {PROJECT_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-shrink-0 whitespace-nowrap min-w-[100px]"
                >
                  <div className="flex items-center gap-1">
                    {tab.label}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                            <Info className="h-3.5 w-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                          {tab.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              <div className="border rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Рабочая зона проекта: объекты, сметы, платежи и финансы.</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {canManageEstimates && (
                    <Button size="sm" onClick={() => setCreateObjectOpen(true)}>
                      <Building2 className="h-4 w-4 mr-1" /> Создать объект
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => navigate(`/projects/${projectId}/finance/payouts`)}>
                    <Receipt className="h-4 w-4 mr-1" /> Выплаты
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/projects">К списку проектов</Link>
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="objects" className="space-y-3">
              {objectsLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : objects && objects.length > 0 ? (
                <div className="grid gap-3">
                  {objects.map((obj: ProjectObject) => {
                    const objEstimates = (estimates || []).filter((e: any) => e.object_id === obj.id);
                    const objIncome = (financeEntries || [])
                      .filter((f: any) => f.object_id === obj.id && f.type === "income")
                      .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
                    const objExpenses = (financeEntries || [])
                      .filter((f: any) => f.object_id === obj.id && f.type === "expense")
                      .reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
                    const objDistributable = Math.max(objIncome - objExpenses, 0);

                    return (
                      <div key={obj.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                         <div className="flex items-center gap-1">
                           <p className="font-semibold">{obj.title}</p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Название объекта проекта
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="flex items-center gap-1">
                           <p className="text-sm text-muted-foreground">{obj.address || "Адрес не указан"}</p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Адрес, по которому находится объект
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                          </div>
                          <Badge variant="outline">{obj.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                          <div>Доход: <span className="font-medium">{objIncome.toLocaleString("ru-RU")}</span></div>
                          <div>Расход: <span className="font-medium">{objExpenses.toLocaleString("ru-RU")}</span></div>
                          <div>Распределяемо: <span className="font-medium">{objDistributable.toLocaleString("ru-RU")}</span></div>
                          <div>Смет: <span className="font-medium">{objEstimates.length}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">Объектов пока нет</div>
              )}
            </TabsContent>

            <TabsContent value="estimates" className="space-y-3">
              {estimatesLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : estimates && estimates.length > 0 ? (
                <div className="space-y-2">
                  {estimates.map((estimate: any) => (
                    <button
                      key={estimate.id}
                      type="button"
                      onClick={() => navigate(`/projects/${projectId}/estimates/${estimate.id}`)}
                      className="w-full text-left border rounded-lg p-3 hover:bg-muted/50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                         <div className="flex items-center gap-1">
                           <p className="font-mono text-sm font-semibold truncate">{estimate.estimate_number}</p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Номер сметы в системе (автоматически генерируется)
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="flex items-center gap-1">
                           <p className="text-sm text-muted-foreground truncate">{estimate.title || "Без названия"}</p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Название сметы (может быть пустым)
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="flex items-center gap-1">
                           <p className="text-xs text-muted-foreground">
                             Объект: {estimate.object_id ? (objectNameById[estimate.object_id] || "Не найден") : "Не назначен"}
                           </p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Объект, с которым связана эта смета
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">v{estimate.version || 1}</Badge>
                          {canViewPrices && (
                            <p className="text-sm font-medium mt-1">{Number(estimate.total || 0).toLocaleString("ru-RU")}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">Смет пока нет</div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-3">
              {paymentsLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : payments && payments.length > 0 ? (
                <div className="space-y-2">
                  {payments.map((payment: any) => (
                    <div key={payment.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                      <div>
                         <div className="flex items-center gap-1">
                           <p className="text-sm">{payment.status}</p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Статус платежа: pending (ожидает), confirmed (подтверждён), refunded (возвращён)
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="flex items-center gap-1">
                           <p className="text-xs text-muted-foreground">
                             {format(new Date(payment.created_at), "d MMM yyyy, HH:mm", { locale: ru })}
                           </p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Дата и время создания платежа
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="flex items-center gap-1">
                           <p className="text-xs text-muted-foreground">
                             Объект: {payment.object_id ? (objectNameById[payment.object_id] || "Не найден") : "Не назначен"}
                           </p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Объект, к которому относится платеж
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                      </div>
                      <p className="font-semibold">{Number(payment.amount || 0).toLocaleString("ru-RU")} {payment.currency}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">Платежей пока нет</div>
              )}
            </TabsContent>

            <TabsContent value="finance" className="space-y-3">
              {financeLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : financeEntries && financeEntries.length > 0 ? (
                <div className="space-y-2">
                  {financeEntries.map((entry: any) => (
                    <div key={entry.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                      <div>
                         <div className="flex items-center gap-1">
                           <p className="text-sm flex items-center gap-2">
                             <Wallet className="h-4 w-4" /> {entry.type === "income" ? "Доход" : "Расход"}
                           </p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Тип финансовой записи: доход (income) или расход (expense)
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="flex items-center gap-1">
                           <p className="text-xs text-muted-foreground">{entry.source}</p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Источник финансовой записи: estimate_payment, manual, refund и другие
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                         <div className="flex items-center gap-1">
                           <p className="text-xs text-muted-foreground">
                             Объект: {entry.object_id ? (objectNameById[entry.object_id] || "Не найден") : "Не назначен"}
                           </p>
                           <TooltipProvider>
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                   <Info className="h-3.5 w-3.5" />
                                 </span>
                               </TooltipTrigger>
                               <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                 Объект, к которому относится финансовая запись
                               </TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                         </div>
                      </div>
                      <p className={`font-semibold ${entry.type === "income" ? "text-emerald-600" : "text-destructive"}`}>
                        {Number(entry.amount || 0).toLocaleString("ru-RU")} {entry.currency}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-lg p-8 text-center text-muted-foreground">Финансовых записей пока нет</div>
              )}
            </TabsContent>
          </Tabs>

          <Dialog open={createObjectOpen} onOpenChange={setCreateObjectOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Новый объект проекта</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Название объекта</label>
                  <Input
                    value={newObject.title}
                    onChange={(e) => setNewObject((p) => ({ ...p, title: e.target.value }))}
                    placeholder="Квартира на Балке"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Адрес</label>
                  <Input
                    value={newObject.address}
                    onChange={(e) => setNewObject((p) => ({ ...p, address: e.target.value }))}
                    placeholder="г. Тирасполь, ..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateObjectOpen(false)}>Отмена</Button>
                <Button onClick={handleCreateObject} disabled={!newObject.title || createProjectObject.isPending}>
                  {createProjectObject.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ProtectedEstimator>
    </Layout>
  );
};

export default ProjectDetail;
