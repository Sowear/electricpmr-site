import { Clock, Wrench, CheckCircle2, Shield, Crown, UserCog, Users, type LucideIcon } from "lucide-react";
import type { UserRole } from "@/hooks/useUserRole";

export type RequestStatus = "new" | "in_progress" | "done";

export interface Request {
  id: string;
  name: string;
  phone: string;
  service_type: string;
  description: string | null;
  status: RequestStatus;
  created_at: string;
  user_id: string | null;
  assigned_to?: string | null;
  source?: string;
  address?: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: string;
  immutable: boolean;
  assigned_by: string | null;
  assigned_at: string | null;
}

export interface ProfileWithRoles {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  created_at: string;
  email?: string | null;
  roles: UserRoleRow[];
}

export const statusConfig: Record<RequestStatus, { label: string; icon: LucideIcon; class: string }> = {
  new: { label: "Новая", icon: Clock, class: "badge-new" },
  in_progress: { label: "В работе", icon: Wrench, class: "badge-in-progress" },
  done: { label: "Выполнена", icon: CheckCircle2, class: "badge-done" },
};

export const STATUS_ORDER: RequestStatus[] = ["new", "in_progress", "done"];

export const ROLE_LABELS: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  super_admin: { label: "Супер-админ", color: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: Crown },
  admin: { label: "Админ", color: "bg-primary/10 text-primary border-primary/20", icon: Shield },
  manager: { label: "Менеджер", color: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: UserCog },
  technician: { label: "Электрик", color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: Wrench },
  user: { label: "Пользователь", color: "bg-muted text-muted-foreground", icon: Users },
};

// Roles an admin can toggle from the UI. 'admin' is shown but only super_admin
// can actually grant/revoke it (enforced server-side); the UI confirms first.
export const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'manager', 'technician'];

// Roles that make a user "staff" — eligible to be assigned to a request.
export const STAFF_ROLES = ['admin', 'super_admin', 'manager', 'technician'];

export interface StaffMember {
  user_id: string;
  name: string;
}
