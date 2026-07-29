import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';

/**
 * Middleware: Requires read access to attendance and leave data.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, GUARDIAN.
 */
export function requireAttendanceRead(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking attendance permissions',
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Insufficient privileges to read attendance/leave data',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires write access to attendance and leave data.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT (for submitting leave requests).
 */
export function requireAttendanceWrite(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking attendance permissions',
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Requires write access to attendance/leave data',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires Admin access for attendance overrides, lock rules, or freezing.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN.
 */
export function requireAttendanceAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking attendance permissions',
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Requires Admin privileges for this attendance operation',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
