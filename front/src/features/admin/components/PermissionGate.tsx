'use client';

import type { ReactNode } from 'react';
import type { PermissionKey } from '@/features/admin/permissions';
import { usePermissions } from '@/hooks/usePermissions';

type PermissionGateProps = {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
};

export function PermissionGate({ permission, children, fallback = null }: PermissionGateProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
