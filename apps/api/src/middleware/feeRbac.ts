import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Enrollment } from '../models/Enrollment';
import { StudentGuardian } from '../models/StudentGuardian';

declare global {
  namespace Express {
    interface Request {
      feeTeacherClassIds?: string[];
      feeScopedStudentIds?: string[];
    }
  }
}

/**
 * Middleware: Requires read access to fee management and finance records.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, ACCOUNTANT, TEACHER, STUDENT, GUARDIAN.
 */
export function requireFeeRead(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking fee permissions'
      );
    }

    const allowedRoles = [
      'SUPER_ADMIN',
      'SCHOOL_ADMIN',
      'ACCOUNTANT',
      'TEACHER',
      'STUDENT',
      'GUARDIAN',
    ];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Insufficient privileges to read fee data'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires Admin or Accountant access to manage fees, generate invoices, record payments, and view reports.
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN, ACCOUNTANT.
 */
export function requireFeeAdminAccountant(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking fee management permissions'
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ACCOUNTANT'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Only Admin or Accountant roles can perform this fee operation'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Requires Super Admin or School Admin authority (e.g., non-standard waivers, reversals, template archive).
 * Allows: SUPER_ADMIN, SCHOOL_ADMIN.
 */
export function requireFeeSuperOrSchoolAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking fee admin permissions'
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Only Super Admin or School Admin can perform this sensitive financial action'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Enforces mandatory auditReason and approvedBy metadata on sensitive mutations (waivers, cancellations, refunds, reversals).
 */
export function enforceMandatoryAuditMetadata(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const { auditReason, approvedBy } = req.body || {};
    if (!auditReason || typeof auditReason !== 'string' || auditReason.trim().length < 5) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Mandatory auditReason of at least 5 characters is required for this financial mutation'
      );
    }
    if (!approvedBy || typeof approvedBy !== 'string' || approvedBy.trim().length === 0) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Mandatory approvedBy user ID is required for this financial mutation'
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Enforces teacher read-only visibility scoping for assigned classes.
 */
export async function enforceTeacherFeeReadScope(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'SCHOOL_ADMIN' ||
      req.user.role === 'ACCOUNTANT'
    ) {
      return next();
    }

    if (req.user.role === 'TEACHER') {
      const teacherId = req.user.profileRef;
      if (!teacherId) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Teacher profile unlinked from user account'
        );
      }

      const assignments = await TeachingAssignment.find({
        teacherId,
        status: 'ACTIVE',
      })
        .select('classId')
        .lean();

      const assignedClassIds = Array.from(
        new Set(assignments.map((a) => a.classId.toString()))
      );

      if (assignedClassIds.length === 0) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Teacher has no active class assignments to view fee reports'
        );
      }

      const requestedClassId =
        (req.query.classId as string) || req.params.classId || req.body?.classId;
      if (requestedClassId && !assignedClassIds.includes(requestedClassId.toString())) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Teacher is not assigned to view fee reports for this class'
        );
      }

      req.feeTeacherClassIds = assignedClassIds;
      return next();
    }

    // STUDENT or GUARDIAN should not hit general teacher endpoints
    if (req.user.role === 'STUDENT' || req.user.role === 'GUARDIAN') {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Students and guardians must use self-service fee endpoints'
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Enforces Student and Guardian self-service scoping.
 */
export async function enforceStudentFeeSelfServiceScope(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'SCHOOL_ADMIN' ||
      req.user.role === 'ACCOUNTANT'
    ) {
      return next();
    }

    if (req.user.role === 'STUDENT') {
      const studentId = req.user.profileRef;
      if (!studentId) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Student profile unlinked from user account'
        );
      }
      req.feeScopedStudentIds = [studentId.toString()];
      return next();
    }

    if (req.user.role === 'GUARDIAN') {
      const guardianId = req.user.profileRef;
      if (!guardianId) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Guardian profile unlinked from user account'
        );
      }

      const links = await StudentGuardian.find({
        guardianId,
        status: 'ACTIVE',
      })
        .select('studentId')
        .lean();

      if (links.length === 0) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Guardian has no active student associations'
        );
      }

      req.feeScopedStudentIds = links.map((l) => l.studentId.toString());
      return next();
    }

    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Unauthorized role for self-service fee endpoint'
    );
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Enforces access to a specific student enrollment ledger or invoice.
 */
export async function enforceEnrollmentFeeAccess(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (
      req.user.role === 'SUPER_ADMIN' ||
      req.user.role === 'SCHOOL_ADMIN' ||
      req.user.role === 'ACCOUNTANT'
    ) {
      return next();
    }

    const enrollmentId =
      req.params.enrollmentId || req.params.id || req.query.enrollmentId;
    if (!enrollmentId) {
      return next();
    }

    const enrollment = await Enrollment.findById(enrollmentId).select('studentId').lean();
    if (!enrollment) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Enrollment record not found');
    }

    const targetStudentId = enrollment.studentId.toString();

    if (req.user.role === 'STUDENT') {
      if (req.user.profileRef !== targetStudentId) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Student can only access their own fee records'
        );
      }
      return next();
    }

    if (req.user.role === 'GUARDIAN') {
      const link = await StudentGuardian.findOne({
        guardianId: req.user.profileRef,
        studentId: targetStudentId,
        status: 'ACTIVE',
      }).lean();

      if (!link) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Guardian is not authorized to view fee records for this student'
        );
      }
      return next();
    }

    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Insufficient privileges to view this fee record'
    );
  } catch (err) {
    next(err);
  }
}
