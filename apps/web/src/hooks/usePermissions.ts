import { useCallback } from 'react';
import { roleHasPermission, canRoleAccessModule } from '@laps/shared';
import { useAuth } from './useAuth';

/**
 * Hook for UI element conditional rendering based on RBAC permissions.
 * IMPORTANT: Frontend permission checks are for UI element rendering only.
 * The backend RBAC middleware (requirePermission) is authoritative.
 */
export function usePermissions() {
  const { user } = useAuth();

  const can = useCallback(
    (arg1: string, arg2?: string, arg3?: string): boolean => {
      if (!user || !user.role) return false;
      if (user.role.toUpperCase() === 'SUPER_ADMIN') return true;

      // 1. Permission string format check (e.g. 'attendance.view' or 'homework.*')
      if (!arg2 && !arg3) {
        if (arg1.includes('.')) {
          return roleHasPermission(user.role, arg1);
        }
        return canRoleAccessModule(user.role, arg1, 'read');
      }

      // 2. Multi-arg check (module, action, resource) or (resource, action)
      const moduleName = arg3 ? arg1 : undefined;
      const actionName = arg3 ? arg2! : arg2 || 'read';
      const resourceName = arg3 ? arg3 : arg1;

      // Check user's explicit DB-populated permissions first
      const perms = user.permissions || [];
      const targetMod = moduleName?.toUpperCase();
      const targetAct = actionName.toUpperCase();
      const targetRes = resourceName?.toLowerCase();

      const hasExplicitPerm = perms.some((p) => {
        const actionMatch = p.action === 'ALL' || p.action === targetAct;
        const modMatch = !targetMod || p.module === targetMod;
        const resMatch = !targetRes || p.resource === targetRes;
        return actionMatch && modMatch && resMatch;
      });

      if (hasExplicitPerm) return true;

      // Fallback to centralized matrix check
      return (
        canRoleAccessModule(user.role, resourceName || moduleName || '', actionName) ||
        roleHasPermission(user.role, `${(resourceName || moduleName || '').toLowerCase()}.${actionName.toLowerCase()}`)
      );
    },
    [user],
  );

  const cannot = useCallback(
    (arg1: string, arg2?: string, arg3?: string): boolean => {
      return !can(arg1, arg2, arg3);
    },
    [can],
  );

  const hasRole = useCallback(
    (roleOrRoles: string | string[]): boolean => {
      if (!user || !user.role) return false;
      const currentRole = user.role.toUpperCase();
      if (currentRole === 'SUPER_ADMIN') return true;

      if (Array.isArray(roleOrRoles)) {
        return roleOrRoles.some((r) => r.toUpperCase() === currentRole);
      }
      return roleOrRoles.toUpperCase() === currentRole;
    },
    [user],
  );

  const hasPermission = useCallback(
    (permissionString: string): boolean => {
      if (!user || !user.role) return false;
      if (user.role.toUpperCase() === 'SUPER_ADMIN') return true;
      return roleHasPermission(user.role, permissionString);
    },
    [user],
  );

  return { can, cannot, hasRole, hasPermission };
}
