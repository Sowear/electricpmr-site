import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Search, Crown, Filter } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { canChangeRole, type UserRole } from "@/hooks/useUserRole";
import { type ProfileWithRoles, ROLE_LABELS, ASSIGNABLE_ROLES } from "./adminTypes";

interface UsersTabProps {
  profiles: ProfileWithRoles[];
  currentRoles: UserRole[];
  currentUserId: string | null;
  authUserId: string | undefined;
  updatingRole: string | null;
  onToggleRole: (targetUserId: string, role: UserRole, hasRole: boolean) => void;
}

export default function UsersTab({ profiles, currentRoles, currentUserId, authUserId, updatingRole, onToggleRole }: UsersTabProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [confirmGrant, setConfirmGrant] = useState<{ userId: string; name: string } | null>(null);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => map.set(p.user_id, p.name || "Без имени"));
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((p) => {
      const matchesRole =
        roleFilter === "all" || p.roles.some((r) => r.role === roleFilter);
      const matchesSearch =
        !q ||
        (p.name || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.phone || "").includes(search);
      return matchesRole && matchesSearch;
    });
  }, [profiles, search, roleFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Поиск по имени, email, телефону..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              {Object.entries(ROLE_LABELS).map(([role, cfg]) => (
                <SelectItem key={role} value={role}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 card-industrial"><p className="text-muted-foreground">Пользователей не найдено</p></div>
      ) : (
        filtered.map((profile) => {
          const roleNames = profile.roles.map((r) => r.role as UserRole);
          const hasImmutable = profile.roles.some((r) => r.immutable);
          const isCurrentUser = authUserId === profile.user_id;
          const canModify = currentUserId
            ? canChangeRole(currentRoles, currentUserId, profile.user_id, roleNames, hasImmutable)
            : { allowed: false, reason: undefined as string | undefined };

          // Most recent audit info across this user's assigned roles.
          const lastAssigned = profile.roles
            .filter((r) => r.assigned_at)
            .sort((a, b) => (b.assigned_at || "").localeCompare(a.assigned_at || ""))[0];

          return (
            <div key={profile.id} className="card-industrial p-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold">{profile.name || "Без имени"}</h3>
                    {hasImmutable && (
                      <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">
                        <Crown className="h-3 w-3 mr-1" />Защищён
                      </Badge>
                    )}
                    {roleNames.filter((r) => r !== "user" && r !== "guest").map((role) => {
                      const cfg = ROLE_LABELS[role] || ROLE_LABELS.user;
                      const Icon = cfg.icon;
                      return (
                        <Badge key={role} className={cfg.color}>
                          <Icon className="h-3 w-3 mr-1" />{cfg.label}
                        </Badge>
                      );
                    })}
                  </div>
                  {profile.email && <p className="text-sm text-muted-foreground truncate">{profile.email}</p>}
                  <p className="text-sm text-muted-foreground">{profile.phone || "Телефон не указан"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Регистрация: {format(new Date(profile.created_at), "d MMM yyyy", { locale: ru })}
                  </p>
                  {lastAssigned?.assigned_at && (
                    <p className="text-xs text-muted-foreground">
                      Роль обновлена {format(new Date(lastAssigned.assigned_at), "d MMM yyyy", { locale: ru })}
                      {lastAssigned.assigned_by && nameById.has(lastAssigned.assigned_by) && ` · ${nameById.get(lastAssigned.assigned_by)}`}
                    </p>
                  )}
                </div>

                {!isCurrentUser ? (
                  <div className="flex flex-wrap gap-1">
                    {ASSIGNABLE_ROLES.map((role) => {
                      const hasRole = roleNames.includes(role);
                      const roleRow = profile.roles.find((r) => r.role === role);
                      const isRoleImmutable = roleRow?.immutable || false;
                      const busy = updatingRole === `${profile.user_id}-${role}`;
                      const isDisabled = !canModify.allowed || isRoleImmutable || busy;
                      const tip = isRoleImmutable
                        ? "Защищённая роль — изменить может только супер-админ."
                        : !canModify.allowed
                          ? canModify.reason
                          : undefined;

                      const handleClick = () => {
                        // Granting admin is sensitive — confirm first.
                        if (!hasRole && role === "admin") {
                          setConfirmGrant({ userId: profile.user_id, name: profile.name || "Без имени" });
                          return;
                        }
                        onToggleRole(profile.user_id, role, hasRole);
                      };

                      return (
                        <Tooltip key={role}>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                size="sm"
                                variant={hasRole ? "default" : "outline"}
                                onClick={handleClick}
                                disabled={isDisabled}
                                className="text-xs"
                              >
                                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : (ROLE_LABELS[role]?.label || role)}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {tip && <TooltipContent>{tip}</TooltipContent>}
                        </Tooltip>
                      );
                    })}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">Это вы</Badge>
                )}
              </div>
            </div>
          );
        })
      )}

      <AlertDialog open={!!confirmGrant} onOpenChange={(open) => !open && setConfirmGrant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Назначить роль администратора?</AlertDialogTitle>
            <AlertDialogDescription>
              Пользователь «{confirmGrant?.name}» получит полный доступ к админ-панели.
              Выдавать роль администратора может только супер-админ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmGrant) onToggleRole(confirmGrant.userId, "admin", false);
                setConfirmGrant(null);
              }}
            >
              Назначить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
