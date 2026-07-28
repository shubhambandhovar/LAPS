import { useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook for UI element conditional rendering based on RBAC permissions.
 * IMPORTANT: Frontend permission checks are for UI element rendering only.
 * The backend RBAC middleware (requirePermission) is authoritative.
 */
export function usePermissions() {
  const { user } = useAuth();

  const can = useCallback(
    (moduleName: string, actionName: string, resourceName?: string): boolean => {
      if (!user) return false;
      if (user.role === 'SUPER_ADMIN') return true;

      const perms = user.permissions || [];
      const targetMod = moduleName.toUpperCase();
      const targetAct = actionName.toUpperCase();
      const targetRes = resourceName?.toLowerCase();

      return perms.some((p) => {
        const actionMatch = p.action === 'ALL' || p.action === targetAct;
        const modMatch = !targetMod || p.module === targetMod;
        const resMatch = !targetRes || p.resource === targetRes;
        return actionMatch && modMatch && resMatch;
      });
    },
    [user],
  );

  return { can };
}
