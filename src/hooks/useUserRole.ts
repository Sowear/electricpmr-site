import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'guest' | 'user' | 'admin' | 'manager' | 'technician' | 'super_admin';

// Vladislav's user ID - immutable super_admin
export const SUPER_ADMIN_ID = 'aeb95ec9-4ced-4fd1-9b89-a63089306b07';

interface UserRoleInfo {
  roles: UserRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isManager: boolean;
  isTechnician: boolean;
  canManageEstimates: boolean;
  canViewPrices: boolean;
  canChangeStatus: boolean;
  canManageRoles: boolean;
  isLoading: boolean;
  userId: string | null;
}

export function useUserRole(): UserRoleInfo {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setRoles([]);
        setUserId(null);
        setIsLoading(false);
        return;
      }

      setUserId(session.user.id);

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);

      setRoles((data || []).map(r => r.role as UserRole));
      setIsLoading(false);
    };

    fetchRoles();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRoles();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isSuperAdmin = roles.includes('super_admin');
  const isAdmin = roles.includes('admin') || isSuperAdmin;
  const isManager = roles.includes('manager');
  const isTechnician = roles.includes('technician');

  return {
    roles,
    isAdmin,
    isSuperAdmin,
    isManager,
    isTechnician,
    canManageEstimates: isAdmin || isManager,
    canViewPrices: isAdmin || isManager,
    canChangeStatus: isAdmin || isManager,
    canManageRoles: isSuperAdmin || isAdmin,
    isLoading,
    userId,
  };
}

/**
 * Check if a role change is allowed based on RBAC rules:
 * - super_admin can do anything
 * - admin can assign/remove roles for manager/technician only
 * - admin cannot remove roles from other admins (only super_admin can)
 * - immutable roles cannot be changed by anyone except the user themselves (if super_admin)
 */
export function canChangeRole(
  currentUserRoles: UserRole[],
  currentUserId: string,
  targetUserId: string,
  targetRoles: UserRole[],
  targetImmutable: boolean
): { allowed: boolean; reason?: string } {
  const isSuperAdmin = currentUserRoles.includes('super_admin');
  
  // Super admin can do anything
  if (isSuperAdmin) return { allowed: true };
  
  // Check immutable
  if (targetImmutable) {
    return { allowed: false, reason: 'Эта роль защищена. Только Владислав (super_admin) может изменять.' };
  }
  
  const isCurrentAdmin = currentUserRoles.includes('admin');
  if (!isCurrentAdmin) {
    return { allowed: false, reason: 'Недостаточно прав для управления ролями.' };
  }
  
  // Admin cannot change other admins or super_admins
  if (targetRoles.includes('admin') || targetRoles.includes('super_admin')) {
    return { allowed: false, reason: 'Администратор не может изменять роли другого администратора.' };
  }
  
  // Cannot change own roles (except super_admin)
  if (currentUserId === targetUserId) {
    return { allowed: false, reason: 'Нельзя изменять собственные роли.' };
  }
  
  return { allowed: true };
}
