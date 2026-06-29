import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { supabase, type User } from "@/integrations/supabase/client";
import { Loader2, Users, FileText, Image, Crown, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useUserRole, canChangeRole, type UserRole } from "@/hooks/useUserRole";
import {
  type Request, type RequestStatus, type ProfileWithRoles, type UserRoleRow, type StaffMember,
  STAFF_ROLES,
} from "./admin/adminTypes";
import RequestsTab from "./admin/RequestsTab";
import UsersTab from "./admin/UsersTab";

const POLL_INTERVAL_MS = 45_000;

const AdminUsers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isSuperAdmin, roles: currentRoles, userId: currentUserId, isLoading: roleLoading } = useUserRole();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: "requests" | "users" = searchParams.get("tab") === "users" ? "users" : "requests";
  const setActiveTab = useCallback((tab: "requests" | "users") => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const [requests, setRequests] = useState<Request[]>([]);
  const [profiles, setProfiles] = useState<ProfileWithRoles[]>([]);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const mutatingRef = useRef(false);

  // Fetch profiles + roles + emails and merge them. Returns the merged list.
  const loadProfiles = useCallback(async (): Promise<ProfileWithRoles[]> => {
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles").select("*").order("created_at", { ascending: false });
    if (profilesError) {
      toast({ title: "Ошибка", description: "Не удалось загрузить пользователей", variant: "destructive" });
      return [];
    }

    const { data: rolesData } = await supabase.from("user_roles").select("*");

    // Emails live in auth.users; exposed via an admin-only RPC. Degrade gracefully
    // (e.g. on the Cloudflare backend the RPC may be absent) — just omit emails.
    const emailMap = new Map<string, string>();
    const { data: emailRows } = await supabase.rpc<{ user_id: string; email: string }[]>("admin_list_user_emails");
    (Array.isArray(emailRows) ? emailRows : [])?.forEach((row) => {
      if (row?.user_id) emailMap.set(row.user_id, row.email);
    });

    const merged: ProfileWithRoles[] = (profilesData || []).map((profile: Omit<ProfileWithRoles, "roles" | "email">) => ({
      ...profile,
      email: emailMap.get(profile.user_id) ?? null,
      roles: (rolesData || []).filter((r: UserRoleRow) => r.user_id === profile.user_id) as UserRoleRow[],
    }));
    return merged;
  }, [toast]);

  const fetchData = useCallback(async (showSpinner = true) => {
    if (showSpinner) setIsLoading(true);

    const { data: requestsData, error: requestsError } = await supabase
      .from("requests").select("*").order("created_at", { ascending: false });
    if (requestsError) {
      toast({ title: "Ошибка", description: "Не удалось загрузить заявки", variant: "destructive" });
    } else if (requestsData) {
      setRequests(requestsData as Request[]);
    }

    setProfiles(await loadProfiles());
    if (showSpinner) setIsLoading(false);
  }, [loadProfiles, toast]);

  // Auth gate
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) navigate("/auth");
      else setUser(session.user);
    });
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

  // Background refresh (the data client has no realtime; poll instead).
  useEffect(() => {
    if (!isAdmin || roleLoading) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible" && !mutatingRef.current) {
        fetchData(false);
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isAdmin, roleLoading, fetchData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === "1") setActiveTab("requests");
      if (e.key === "2") setActiveTab("users");
      if (e.key === "r") fetchData();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fetchData, setActiveTab]);

  // ---- Optimistic request mutations ----
  const updateRequestStatus = useCallback(async (id: string, status: RequestStatus) => {
    const prev = requests;
    mutatingRef.current = true;
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const { error } = await supabase.from("requests").update({ status }).eq("id", id);
    mutatingRef.current = false;
    if (error) {
      setRequests(prev);
      toast({ title: "Ошибка", description: "Не удалось обновить статус", variant: "destructive" });
    } else {
      toast({ title: "Статус обновлён" });
    }
  }, [requests, toast]);

  const assignRequest = useCallback(async (id: string, assignedTo: string | null) => {
    const prev = requests;
    mutatingRef.current = true;
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, assigned_to: assignedTo } : r)));
    const { error } = await supabase.from("requests").update({ assigned_to: assignedTo }).eq("id", id);
    mutatingRef.current = false;
    if (error) {
      setRequests(prev);
      toast({ title: "Ошибка", description: "Не удалось назначить исполнителя", variant: "destructive" });
    } else {
      toast({ title: assignedTo ? "Исполнитель назначен" : "Назначение снято" });
    }
  }, [requests, toast]);

  const deleteRequest = useCallback(async (id: string) => {
    const prev = requests;
    mutatingRef.current = true;
    setRequests((rs) => rs.filter((r) => r.id !== id));
    const { error } = await supabase.from("requests").delete().eq("id", id);
    mutatingRef.current = false;
    if (error) {
      setRequests(prev);
      toast({ title: "Ошибка", description: "Не удалось удалить заявку", variant: "destructive" });
    } else {
      toast({ title: "Заявка удалена" });
    }
  }, [requests, toast]);

  // ---- Role mutation ----
  const toggleRole = useCallback(async (targetUserId: string, role: UserRole, hasRole: boolean) => {
    const targetProfile = profiles.find((p) => p.user_id === targetUserId);
    if (!targetProfile || !currentUserId) return;

    const targetRoleNames = targetProfile.roles.map((r) => r.role as UserRole);
    const targetHasImmutable = targetProfile.roles.some((r) => r.immutable);
    const check = canChangeRole(currentRoles, currentUserId, targetUserId, targetRoleNames, targetHasImmutable);
    if (!check.allowed) {
      toast({ title: "Запрещено", description: check.reason, variant: "destructive" });
      return;
    }

    setUpdatingRole(`${targetUserId}-${role}`);
    mutatingRef.current = true;

    let error;
    if (hasRole) {
      const roleRow = targetProfile.roles.find((r) => r.role === role);
      if (roleRow?.immutable && !isSuperAdmin) {
        toast({ title: "Запрещено", description: "Эта роль защищена и не может быть снята.", variant: "destructive" });
        setUpdatingRole(null);
        mutatingRef.current = false;
        return;
      }
      ({ error } = await supabase.from("user_roles").delete().eq("user_id", targetUserId).eq("role", role));
    } else {
      ({ error } = await supabase.from("user_roles").insert({
        user_id: targetUserId,
        role,
        assigned_by: currentUserId,
        assigned_at: new Date().toISOString(),
      }));
    }

    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: hasRole ? "Роль снята" : "Роль назначена" });
      setProfiles(await loadProfiles());
    }
    setUpdatingRole(null);
    mutatingRef.current = false;
  }, [profiles, currentRoles, currentUserId, isSuperAdmin, loadProfiles, toast]);

  // Derived: staff eligible for request assignment, and a name lookup.
  const staff = useMemo<StaffMember[]>(() =>
    profiles
      .filter((p) => p.roles.some((r) => STAFF_ROLES.includes(r.role)))
      .map((p) => ({ user_id: p.user_id, name: p.name || p.email || "Без имени" })),
    [profiles]);

  const staffNameById = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => map.set(p.user_id, p.name || p.email || "Без имени"));
    return map;
  }, [profiles]);

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
          <Button variant="outline" size="sm" asChild><Link to="/admin/finance-settings">Фин. настройки</Link></Button>
          <Button variant="outline" size="sm" asChild><Link to="/admin/editor"><Zap className="mr-2 h-4 w-4" />Проектировщик</Link></Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeTab === "requests" ? (
          <RequestsTab
            requests={requests}
            staff={staff}
            staffNameById={staffNameById}
            onUpdateStatus={updateRequestStatus}
            onAssign={assignRequest}
            onDelete={deleteRequest}
          />
        ) : (
          <UsersTab
            profiles={profiles}
            currentRoles={currentRoles}
            currentUserId={currentUserId}
            authUserId={user?.id}
            updatingRole={updatingRole}
            onToggleRole={toggleRole}
          />
        )}
      </div>
    </Layout>
  );
};

export default AdminUsers;
