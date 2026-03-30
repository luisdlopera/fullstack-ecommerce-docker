import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermissionForRole, type PermissionKey } from '@/features/admin/permissions';

export function usePermissions() {
  const { user, loading, logout, refreshSession, login, register } = useAuth();

  return useMemo(() => {
    const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : [];
    const permissions = user?.permissions ?? [];

    const hasPermission = (permission: PermissionKey): boolean => {
      if (!user) return false;
      if (permissions.includes(permission)) return true;
      return roles.some((role) => hasPermissionForRole(role, permission));
    };

    return {
      user,
      loading,
      logout,
      refreshSession,
      login,
      register,
      roles,
      permissions,
      hasPermission,
      isAdmin: roles.some((role) => role !== 'CUSTOMER'),
    };
  }, [loading, login, logout, refreshSession, register, user]);
}
