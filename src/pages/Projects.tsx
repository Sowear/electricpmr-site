import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ProtectedEstimator from "@/components/estimator/ProtectedEstimator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FolderOpen, Phone, Globe, MessageSquare,
  Instagram, Users, MoreHorizontal, Loader2, Info,
  Plus, FileText, Search,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useProjects, useCreateProject, useCreateEstimateFromProject, type Project } from "@/hooks/useProjects";
import { useUserRole } from "@/hooks/useUserRole";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SOURCE_OPTIONS = [
  { value: "website", label: "Сайт", icon: Globe },
  { value: "phone", label: "Телефон", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "referral", label: "Лично", icon: Users },
  { value: "other", label: "Другое", icon: FolderOpen },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Новый", color: "bg-blue-500/10 text-blue-600" },
  in_progress: { label: "В работе", color: "bg-amber-500/10 text-amber-600" },
  completed: { label: "Завершён", color: "bg-green-500/10 text-green-700" },
  cancelled: { label: "Отменён", color: "bg-destructive/10 text-destructive" },
};

const Projects = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [estimateDialogOpen, setEstimateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [clientComment, setClientComment] = useState("");
  const [newProject, setNewProject] = useState({
    client_name: "",
    client_phone: "",
    client_email: "",
    client_address: "",
    source: "phone",
  });

  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const createEstimateFromProject = useCreateEstimateFromProject();
  const { canManageEstimates } = useUserRole();

  // Fetch linked estimates count per project
  const { data: projectEstimateCounts } = useQuery({
    queryKey: ["project-estimate-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estimates")
        .select("project_id, status, total");

      if (error) throw error;
      
      const counts: Record<string, { count: number; latestStatus?: string; latestTotal?: number }> = {};
      (data || []).forEach((e: { project_id: string; status: string; total: number }) => {
        if (!e.project_id) return;
        if (!counts[e.project_id]) {
          counts[e.project_id] = { count: 0 };
        }
        counts[e.project_id].count++;
        counts[e.project_id].latestStatus = e.status;
        counts[e.project_id].latestTotal = e.total;
      });
      return counts;
    },
  });

  const filteredProjects = projects?.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.client_name.toLowerCase().includes(q) ||
      p.client_phone?.toLowerCase().includes(q) ||
      p.client_email?.toLowerCase().includes(q) ||
      p.source?.toLowerCase().includes(q)
    );
  });

  const handleCreateProject = async () => {
    const result = await createProject.mutateAsync(newProject);
    if (result) {
      setCreateDialogOpen(false);
      setNewProject({ client_name: "", client_phone: "", client_email: "", client_address: "", source: "phone" });
    }
  };

  const handleCreateEstimate = async () => {
    if (!selectedProject) return;
    const result = await createEstimateFromProject.mutateAsync({
      projectId: selectedProject.id,
      clientComment: clientComment || undefined,
    });
    if (result) {
      setEstimateDialogOpen(false);
      setClientComment("");
      navigate(`/projects/${selectedProject.id}/estimates/${result.id}`);
    }
  };

  const getSourceIcon = (source: string) => {
    const opt = SOURCE_OPTIONS.find((s) => s.value === source);
    if (!opt) return <FolderOpen className="h-4 w-4" />;
    const Icon = opt.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <Layout>
      <ProtectedEstimator>
        <div className="container-main py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold">Проекты</h1>
              <p className="text-sm sm:text-muted-foreground mt-1">Заявки, клиенты и связанные сметы</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center sm:justify-start">
              {canManageEstimates && (
                <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Новый проект
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/estimator')} className="w-full sm:w-auto">
                <FileText className="h-4 w-4 mr-2" />
                Все сметы
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по клиенту, телефону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          {/* Mobile Cards View - Shown on small screens */}
          <div className="space-y-3 sm:hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              filteredProjects.map((project) => {
                const ec = projectEstimateCounts?.[project.id];
                const statusInfo = STATUS_LABELS[project.status] || STATUS_LABELS.new;
                
                return (
                  <div 
                    key={project.id}
                    className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{project.client_name}</p>
                        {project.client_phone && (
                          <p className="text-sm text-muted-foreground truncate">{project.client_phone}</p>
                        )}
                      </div>
                      <Badge className={`${statusInfo.color} ml-2 shrink-0`}>{statusInfo.label}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {getSourceIcon(project.source)}
                          <span>
                            {SOURCE_OPTIONS.find((s) => s.value === project.source)?.label || project.source}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-muted-foreground">
                        {format(new Date(project.created_at), "d MMM yyyy", { locale: ru })}
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t flex justify-between items-center">
                      <div className="flex items-center gap-1">
                        {ec ? (
                          <Badge variant="outline" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {ec.count} смета{ec.count !== 1 ? 'ы' : ''}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Нет смет</span>
                        )}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${project.id}`);
                          }}>
                            <FolderOpen className="h-4 w-4 mr-2" /> Открыть проект
                          </DropdownMenuItem>
                          {canManageEstimates && (
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProject(project);
                              setEstimateDialogOpen(true);
                            }}>
                              <FileText className="h-4 w-4 mr-2" /> Создать смету
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Нет проектов</h3>
                <p className="text-muted-foreground mb-4">Создайте первый проект из заявки клиента</p>
                {canManageEstimates && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Создать проект
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Table View - Hidden on small screens */}
          <div className="hidden sm:block">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Клиент
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                  <Info className="h-3.5 w-3.5" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                Имя клиента и контактная информация
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Источник
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                  <Info className="h-3.5 w-3.5" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                Откуда пришел клиент: сайт, телефон, рекомендация и т.д.
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Сметы
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                  <Info className="h-3.5 w-3.5" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                Количество смет, созданных для этого проекта
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Статус
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                  <Info className="h-3.5 w-3.5" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                Текущий статус проекта: новый, в работе, завершён, отменён
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Дата
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                  <Info className="h-3.5 w-3.5" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                Дата создания проекта
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => {
                      const ec = projectEstimateCounts?.[project.id];
                      const statusInfo = STATUS_LABELS[project.status] || STATUS_LABELS.new;

                      return (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/projects/${project.id}`)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{project.client_name}</p>
                              {project.client_phone && (
                                <p className="text-sm text-muted-foreground">{project.client_phone}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getSourceIcon(project.source)}
                              <span className="text-sm">
                                {SOURCE_OPTIONS.find((s) => s.value === project.source)?.label || project.source}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {ec ? (
                                <Badge variant="outline" className="text-xs">
                                  <FileText className="h-3 w-3 mr-1" />
                                  {ec.count}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-muted-foreground hover:text-foreground cursor-help transition-colors">
                                      <Info className="h-3.5 w-3.5" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs z-[300]">
                                    Количество смет, созданных для этого проекта
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(project.created_at), "d MMM yyyy", { locale: ru })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/projects/${project.id}`);
                                }}>
                                  <FolderOpen className="h-4 w-4 mr-2" /> Открыть проект
                                </DropdownMenuItem>
                                {canManageEstimates && (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedProject(project);
                                    setEstimateDialogOpen(true);
                                  }}>
                                    <FileText className="h-4 w-4 mr-2" /> Создать смету
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Нет проектов</h3>
                <p className="text-muted-foreground mb-4">Создайте первый проект из заявки клиента</p>
                {canManageEstimates && (
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Создать проект
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Create Project Dialog */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogContent className="sm:max-w-md w-[90vw] max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Новый проект</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Имя клиента *</label>
                  <Input
                    value={newProject.client_name}
                    onChange={(e) => setNewProject((p) => ({ ...p, client_name: e.target.value }))}
                    placeholder="Иван Петров"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium">Телефон</label>
                    <Input
                      value={newProject.client_phone}
                      onChange={(e) => setNewProject((p) => ({ ...p, client_phone: e.target.value }))}
                      placeholder="+373 777 12345"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      value={newProject.client_email}
                      onChange={(e) => setNewProject((p) => ({ ...p, client_email: e.target.value }))}
                      placeholder="client@mail.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Адрес</label>
                  <Input
                    value={newProject.client_address}
                    onChange={(e) => setNewProject((p) => ({ ...p, client_address: e.target.value }))}
                    placeholder="ул. Ленина, д. 1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Источник</label>
                  <Select
                    value={newProject.source}
                    onValueChange={(v) => setNewProject((p) => ({ ...p, source: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProject.client_name || createProject.isPending}
                  className="w-full sm:w-auto"
                >
                  {createProject.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Создать
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Estimate from Project Dialog */}
          <Dialog open={estimateDialogOpen} onOpenChange={setEstimateDialogOpen}>
            <DialogContent className="sm:max-w-md w-[90vw] max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Создать смету для {selectedProject?.client_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Данные клиента будут скопированы из проекта. Вы можете добавить комментарий клиента.
                </p>
                <div>
                  <label className="text-sm font-medium">Комментарий клиента</label>
                  <Textarea
                    value={clientComment}
                    onChange={(e) => setClientComment(e.target.value)}
                    placeholder="Пожелания клиента..."
                    rows={3}
                    maxLength={4000}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{clientComment.length}/4000</p>
                </div>
              </div>
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEstimateDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleCreateEstimate}
                  disabled={createEstimateFromProject.isPending}
                  className="w-full sm:w-auto"
                >
                  {createEstimateFromProject.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Создать смету
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ProtectedEstimator>
    </Layout>
  );
};

export default Projects;