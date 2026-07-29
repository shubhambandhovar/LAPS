import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';

/**
 * Middleware: Requires read access to homework, submissions, and study materials.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, GUARDIAN.
 */
export function requireHomeworkRead(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking homework permissions',
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Insufficient privileges to read homework data',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires write access to homework or submissions.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT.
 */
export function requireHomeworkWrite(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking homework permissions',
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Insufficient privileges to write homework data',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires teacher or admin privileges for homework/study material creation and evaluation.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER.
 */
export function requireHomeworkTeacherOrAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking homework permissions',
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Only teachers and administrators can manage homework, study materials, or rubrics',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires administrator privileges for homework archival override.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN.
 */
export function requireHomeworkAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking homework permissions',
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Only administrators can perform this action',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}
