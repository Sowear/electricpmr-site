import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2, Search, Users, FileText, Clock, CheckCircle2, Wrench, Filter, Image, Calculator, Shield, ShieldOff, Crown, UserCog, Plus } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserRole, canChangeRole, type UserRole, SUPER_ADMIN_ID } from "@/hooks/useUserRole";

type RequestStatus = "new" | "in_progress" | "done";

interface Request {
  id: string;
  name: string;
  phone: string;
  service_type: string;
  description: string | null;
  status: RequestStatus;
  created_at: string;
  user_id: string | null;
  source?: string;
  address?: string;
}

interface UserRoleRow {
  id: string;
  user_id: string;
  role: string;
  immutable: boolean;
  assigned_by: string | null;
  assigned_at: string | null;
}

interface ProfileWithRoles {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  email?: string;
  roles: UserRoleRow[];
}

const statusConfig = {
  new: { label: "Новая", icon: Clock, class: "badge-new" },
  in_progress: { label: "В работе", icon: Wrench, class: "badge-in-progress" },
  done: { label: "Выполнена", icon: CheckCircle2, class: "badge-done" },
};

const ROLE_LABELS: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  super_admin: { label: "Супер-админ", color: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: Crown },
  admin: { label: "Админ", color: "bg-primary/10 text-primary border-primary/20", icon: Shield },
  manager: { label: "Менеджер", color: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: UserCog },
  technician: { label: "Электрик", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: Wrench },
  user: { label: "Пользователь", color: "bg-muted text-muted-foreground", icon: Users },
};

const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'manager', 'technician'];

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isSuperAdmin, roles: currentRoles, userId: currentUserId, isLoading: roleLoading } = useUserRole();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "users">("requests");
  
  const [requests, setRequests] = useState<Request[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  
  const [profiles, setProfiles] = useState<ProfileWithRoles[]>([]);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    
    const { data: requestsData } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (requestsData) setRequests(requestsData as Request[]);
    
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("*");
    
    if (profilesData) {
      const profilesWithRoles: ProfileWithRoles[] = profilesData.map(profile => ({
        ...profile,
        roles: (rolesData || []).filter(r => r.user_id === profile.user_id) as UserRoleRow[]
      }));
      setProfiles(profilesWithRoles);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session?.user) navigate("/auth");
        else setUser(session.user);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) navigate("/auth");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin && !roleLoading) fetchData();
  }, [isAdmin, roleLoading, fetchData]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate("/");
  }, [roleLoading, isAdmin, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === "1") setActiveTab("requests");
        if (e.key === "2") setActiveTab("users");
        if (e.key === "r") fetchData();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fetchData]);

  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus) => {
    const { error } = await supabase
      .from("requests")
      .update({ status: newStatus })
      .eq("id", requestId);
    
    if (error) {
      toast({ title: "Ошибка", description: "Не удалось обновить статус", variant: "destructive" });
    } else {
      toast({ title: "Статус обновлён" });
      fetchData();
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
    }
  };

  const handleCreateEstimateFromRequest = (request: Request) => {
    // Navigate to estimator with request data as query params
    const params = new URLSearchParams({
      request_id: request.id,
      client_name: request.name,
      client_phone: request.phone,
      client_comment: request.description || '',
      address: request.address || '',
    });
    navigate(`/estimator?${params.toString()}`);
  };

  const toggleRole = async (targetUserId: string, role: UserRole, hasRole: boolean) => {
    const targetProfile = profiles.find(p => p.user_id === targetUserId);
    if (!targetProfile || !currentUserId) return;

    const targetRoleNames = targetProfile.roles.map(r => r.role as UserRole);
    const targetHasImmutable = targetProfile.roles.some(r => r.immutable);

    const check = canChangeRole(currentRoles, currentUserId, targetUserId, targetRoleNames, targetHasImmutable);
    if (!check.allowed) {
      toast({ title: "Запрещено", description: check.reason, variant: "destructive" });
      return;
    }

    setUpdatingRole(`${targetUserId}-${role}`);

    if (hasRole) {
      // Check if trying to remove an immutable role
      const roleRow = targetProfile.roles.find(r => r.role === role);
      if (roleRow?.immutable && !isSuperAdmin) {
        toast({ title: "Запрещено", description: "Эта роль защищена и не может быть снята.", variant: "destructive" });
        setUpdatingRole(null);
        return;
      }

      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .eq("role", role);

      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Роль снята" });
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({
          user_id: targetUserId,
          role: role as any,
          assigned_by: currentUserId,
          assigned_at: new Date().toISOString(),
        });

      if (error) {
        toast({ title: "Ошибка", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Роль назначена" });
        fetchData();
      }
    }

    setUpdatingRole(null);
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.service_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (!user || roleLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="container-main py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Админ-панель</h1>
            <p className="text-muted-foreground text-sm">
              {isSuperAdmin && <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 mr-2"><Crown className="h-3 w-3 mr-1" />Super Admin</Badge>}
              Alt+1 (заявки), Alt+2 (пользователи), Alt+R (обновить)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={activeTab === "requests" ? "default" : "outline"} onClick={() => setActiveTab("requests")} size="sm">
            <FileText className="mr-2 h-4 w-4" />Заявки ({requests.length})
          </Button>
          <Button variant={activeTab === "users" ? "default" : "outline"} onClick={() => setActiveTab("users")} size="sm">
            <Users className="mr-2 h-4 w-4" />Пользователи ({profiles.length})
          </Button>
          <Button variant="outline" size="sm" asChild><Link to="/admin/work-examples"><Image className="mr-2 h-4 w-4" />Примеры работ</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/estimator"><Calculator className="mr-2 h-4 w-4" />Сметтер</Link></Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeTab === "requests" ? (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Поиск по имени, телефону..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="new">Новые</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="done">Выполненные</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12 card-industrial"><p className="text-muted-foreground">Заявок не найдено</p></div>
                ) : (
                  filteredRequests.map((request) => {
                    const status = statusConfig[request.status];
                    const StatusIcon = status.icon;
                    return (
                      <div key={request.id} className={`card-industrial p-4 cursor-pointer ${selectedRequest?.id === request.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedRequest(request)}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{request.name}</h3>
                              <span className={`badge-status ${status.class} flex-shrink-0`}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{request.service_type} • {request.phone}</p>
                            {request.source && <Badge variant="outline" className="text-xs mt-1">{request.source}</Badge>}
                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(request.created_at), "d MMM yyyy, HH:mm", { locale: ru })}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div>
                {selectedRequest ? (
                  <div className="card-industrial p-6 sticky top-24 space-y-4">
                    <h3 className="font-display font-semibold">Детали заявки</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-muted-foreground">Имя</p><p className="font-medium">{selectedRequest.name}</p></div>
                      <div><p className="text-muted-foreground">Телефон</p><p className="font-medium">{selectedRequest.phone}</p></div>
                      <div className="col-span-2"><p className="text-muted-foreground">Услуга</p><p className="font-medium">{selectedRequest.service_type}</p></div>
                      {selectedRequest.address && <div className="col-span-2"><p className="text-muted-foreground">Адрес</p><p>{selectedRequest.address}</p></div>}
                      {selectedRequest.description && <div className="col-span-2"><p className="text-muted-foreground">Комментарий</p><p>{selectedRequest.description}</p></div>}
                      <div className="col-span-2"><p className="text-muted-foreground">Дата создания</p><p>{format(new Date(selectedRequest.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}</p></div>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Изменить статус</p>
                      <div className="flex flex-wrap gap-2">
                        {(["new", "in_progress", "done"] as RequestStatus[]).map((s) => (
                          <Button key={s} size="sm" variant={selectedRequest.status === s ? "default" : "outline"} onClick={() => updateRequestStatus(selectedRequest.id, s)}>
                            {statusConfig[s].label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <Button size="sm" className="w-full" onClick={() => handleCreateEstimateFromRequest(selectedRequest)}>
                        <Plus className="h-4 w-4 mr-1" />Создать смету из заявки
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="card-industrial p-6 text-center text-muted-foreground"><p>Выберите заявку</p></div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {profiles.length === 0 ? (
              <div className="text-center py-12 card-industrial"><p className="text-muted-foreground">Пользователей не найдено</p></div>
            ) : (
              profiles.map((profile) => {
                const roleNames = profile.roles.map(r => r.role as UserRole);
                const hasImmutable = profile.roles.some(r => r.immutable);
                const isCurrentUser = user?.id === profile.user_id;
                const canModify = currentUserId ? canChangeRole(currentRoles, currentUserId, profile.user_id, roleNames, hasImmutable) : { allowed: false };

                return (
                  <div key={profile.id} className="card-industrial p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{profile.name || "Без имени"}</h3>
                          {hasImmutable && (
                            <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                              <Crown className="h-3 w-3 mr-1" />Защищён
                            </Badge>
                          )}
                          {roleNames.filter(r => r !== 'user' && r !== 'guest').map(role => {
                            const cfg = ROLE_LABELS[role] || ROLE_LABELS.user;
                            const Icon = cfg.icon;
                            return (
                              <Badge key={role} className={cfg.color}>
                                <Icon className="h-3 w-3 mr-1" />{cfg.label}
                              </Badge>
                            );
                          })}
                        </div>
                        <p className="text-sm text-muted-foreground">{profile.phone || "Телефон не указан"}</p>
                        <p className="text-xs text-muted-foreground mt-1">{format(new Date(profile.created_at), "d MMM yyyy", { locale: ru })}</p>
                      </div>

                      {!isCurrentUser && (
                        <div className="flex flex-wrap gap-1">
                          {ASSIGNABLE_ROLES.map(role => {
                            const hasRole = roleNames.includes(role);
                            const roleRow = profile.roles.find(r => r.role === role);
                            const isRoleImmutable = roleRow?.immutable || false;
                            const isDisabled = !canModify.allowed || isRoleImmutable || updatingRole === `${profile.user_id}-${role}`;

                            return (
                              <Tooltip key={role}>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant={hasRole ? "default" : "outline"}
                                    onClick={() => toggleRole(profile.user_id, role, hasRole)}
                                    disabled={isDisabled}
                                    className="text-xs"
                                  >
                                    {updatingRole === `${profile.user_id}-${role}` ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      ROLE_LABELS[role]?.label || role
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                {!canModify.allowed && (
                                  <TooltipContent>{canModify.reason}</TooltipContent>
                                )}
                              </Tooltip>
                            );
                          })}
                        </div>
                      )}
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">Это вы</Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminUsers;
