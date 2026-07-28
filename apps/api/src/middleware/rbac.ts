import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { Role } from '../models/Role';
import { IPermissionDocument } from '../models/Permission';
import { AppError } from '../utils/errors';

/**
 * RBAC Permission verification middleware.
 * Supports:
 * - 3-arg signature: requirePermission('EXAM', 'CREATE', 'mark')
 * - 2-arg signature: requirePermission('student', 'read')
 */
export function requirePermission(
  arg1: string,
  arg2: string,
  arg3?: string,
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(
          401,
          ErrorCodes.AUTH_TOKEN_EXPIRED,
          'Authentication required before checking permissions',
        );
      }

      // SUPER_ADMIN automatically passes all atomic RBAC permission checks
      if (req.user.role === 'SUPER_ADMIN') {
        next();
        return;
      }

      let moduleName: string | undefined;
      let actionName: string;
      let resourceName: string | undefined;

      if (arg3) {
        // (module, action, resource)
        moduleName = arg1.toUpperCase();
        actionName = arg2.toUpperCase();
        resourceName = arg3.toLowerCase();
      } else {
        // (resource, action)
        resourceName = arg1.toLowerCase();
        actionName = arg2.toUpperCase();
      }

      const role = await Role.findOne({
        schoolId: req.user.schoolId,
        code: req.user.role,
      }).populate<{ permissions: IPermissionDocument[] }>('permissions');

      if (!role || !role.permissions) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'User role has no assigned permissions',
        );
      }

      const hasPermission = role.permissions.some((p) => {
        const actionMatch = p.action === 'ALL' || p.action === actionName;
        const resMatch = !resourceName || p.resource === resourceName;
        const modMatch = !moduleName || p.module === moduleName;
        return actionMatch && resMatch && modMatch;
      });

      if (!hasPermission) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          `Permission denied: Requires ${actionName} on ${resourceName || moduleName}`,
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Resource-Scope Authorization framework foundation (enforceScope).
 * Protects against IDOR and validates scope ownership.
 */
export function enforceScope(
  scopeType: 'studentId' | 'teacherId' | 'guardianId' | 'self',
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(
          401,
          ErrorCodes.AUTH_TOKEN_EXPIRED,
          'Authentication required before scope check',
        );
      }

      // SUPER_ADMIN and SCHOOL_ADMIN have global institutional scope
      if (
        req.user.role === 'SUPER_ADMIN' ||
        req.user.role === 'SCHOOL_ADMIN'
      ) {
        next();
        return;
      }

      if (scopeType === 'self') {
        const targetId = req.params.id || req.params.userId || req.query.userId;
        if (targetId && targetId !== req.user.id) {
          throw new AppError(
            403,
            ErrorCodes.AUTH_SCOPE_FORBIDDEN,
            'User is only authorized to access their own resource',
          );
        }
      }

      // Note: Future phases (StudentGuardian, TeachingAssignment) will plug their domain resolvers into this pipeline.
      next();
    } catch (err) {
      next(err);
    }
  };
}
