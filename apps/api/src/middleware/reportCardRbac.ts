import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Enrollment } from '../models/Enrollment';
import { StudentGuardian } from '../models/StudentGuardian';

/**
 * Middleware: Requires read access to report cards, templates, or promotion decisions.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER, STUDENT, GUARDIAN.
 */
export function requireReportCardRead(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking report card permissions'
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Insufficient privileges to read report card data'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires Admin access to manage report card templates, generate report cards, publish, and approve promotions.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN.
 */
export function requireReportCardAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking report card admin permissions'
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Administrator privileges required for this report card or promotion operation'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires Teacher or Admin access to view report cards or enter teacher remarks.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, TEACHER.
 */
export function requireReportCardTeacherOrAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking report card teacher permissions'
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
 * Enforces teacher scoping for report cards and promotion queries.
 * Teachers can only view report cards and promotion decisions for classes where they hold an active TeachingAssignment.
 */
export async function enforceReportCardTeacherScope(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'SCHOOL_ADMIN') {
      return next();
    }

    if (req.user.role === 'TEACHER') {
      const teacherId = req.user.profileRef;
      if (!teacherId) {
        throw new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Teacher profile reference missing');
      }

      const assignments = await TeachingAssignment.find({
        teacherId,
        status: 'ACTIVE',
      }).select('classId sectionId');

      if (!assignments || assignments.length === 0) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'You do not have any active teaching assignments'
        );
      }

      const assignedClassIds = assignments.map((a) => a.classId.toString());
      const queryClassId = req.query.classId as string | undefined;
      const bodyClassId = req.body?.classId as string | undefined;

      const targetClassId = queryClassId || bodyClassId;
      if (targetClassId && !assignedClassIds.includes(targetClassId)) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'You are not assigned to this class'
        );
      }

      req.query.assignedClassIds = assignedClassIds as any;
      return next();
    }

    throw new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Insufficient privileges');
  } catch (err) {
    next(err);
  }
}

/**
 * Enforces student/guardian scoping for self-service report card retrieval.
 * Automatically restricts query to PUBLISHED status and own student enrollment(s).
 */
export async function enforceStudentReportCardScope(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'SCHOOL_ADMIN' || req.user.role === 'TEACHER') {
      return next();
    }

    if (req.user.role === 'STUDENT') {
      const studentId = req.user.profileRef;
      if (!studentId) {
        throw new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Student profile reference missing');
      }

      const enrollments = await Enrollment.find({ studentId, enrollmentStatus: 'ACTIVE' }).select('_id');
      const enrollmentIds = enrollments.map((e) => e._id);

      req.query.enrollmentIds = enrollmentIds as any;
      req.query.studentId = studentId;
      req.query.status = 'PUBLISHED';
      return next();
    }

    if (req.user.role === 'GUARDIAN') {
      const guardianId = req.user.profileRef;
      if (!guardianId) {
        throw new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Guardian profile reference missing');
      }

      const relations = await StudentGuardian.find({ guardianId }).select('studentId');
      const studentIds = relations.map((r) => r.studentId);

      req.query.studentIds = studentIds as any;
      req.query.status = 'PUBLISHED';
      return next();
    }

    throw new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Insufficient privileges');
  } catch (err) {
    next(err);
  }
}
