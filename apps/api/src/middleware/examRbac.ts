import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';

/**
 * Middleware: Requires read access to examinations, schedules, marks, or results.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, GUARDIAN.
 */
export function requireExamRead(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking exam permissions'
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Insufficient privileges to read exam data'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires Admin access to manage examinations, schedules, lock marks, and publish results.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN.
 */
export function requireExamAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking exam admin permissions'
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Administrator privileges required for this examination operation'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires Teacher or Admin access to enter or submit marks and evaluate requests.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER.
 */
export function requireExamTeacherOrAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking exam teacher permissions'
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Teacher or Administrator privileges required'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires Student, Guardian, or Admin access for re-evaluation submission.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, STUDENT, GUARDIAN.
 */
export function requireExamStudentOrGuardianOrAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking exam student permissions'
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'STUDENT', 'GUARDIAN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Student, Guardian, or Administrator privileges required'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
