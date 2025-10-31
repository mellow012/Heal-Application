// hooks/usePermissions.js
import { useMemo } from 'react';
import { hasPermission, hasAllPermissions, hasAnyPermission } from '@/lib/roles';

export function usePermissions(userRole) {
  return useMemo(() => ({
    can: (permission) => hasPermission(userRole, permission),
    canAll: (permissions) => hasAllPermissions(userRole, permissions),
    canAny: (permissions) => hasAnyPermission(userRole, permissions)
  }), [userRole]);
}