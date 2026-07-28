import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';
import { Teacher } from '../models/Teacher';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Enrollment } from '../models/Enrollment';

export function requireStudentRead(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking permissions',
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Insufficient privileges to read student data',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

export function requireStudentWrite(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking permissions',
      );
    }

    const allowedRoles = ['SUPER_ADMIN', 'SCHOOL_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Permission denied: Insufficient privileges to modify student data',
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

export async function requireStudentReadScope(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required before checking permissions',
      );
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'SCHOOL_ADMIN') {
      return next();
    }

    if (req.user.role === 'TEACHER') {
      const teacherProfile = await Teacher.findOne({
        userId: req.user.id,
        status: 'ACTIVE',
      }).exec();

      if (!teacherProfile) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Teacher profile not found or inactive.',
        );
      }

      const assignments = await TeachingAssignment.find({
        teacherId: teacherProfile._id,
        status: 'ACTIVE',
      }).exec();

      const assignedSectionIds = assignments.map((a) => a.sectionId.toString());
      req.teacherAssignedSectionIds = assignedSectionIds;

      if (req.params && req.params.id) {
        if (req.baseUrl.includes('enrollments')) {
          const enr = await Enrollment.findOne({
            _id: req.params.id,
            sectionId: { $in: assignedSectionIds },
          }).exec();

          if (!enr) {
            throw new AppError(
              403,
              ErrorCodes.RBAC_PERMISSION_DENIED,
              'Permission denied: Teacher is not assigned to this enrollment\'s section.',
            );
          }
        } else {
          const enr = await Enrollment.findOne({
            studentId: req.params.id,
            sectionId: { $in: assignedSectionIds },
            enrollmentStatus: 'ACTIVE',
          }).exec();

          if (!enr) {
            throw new AppError(
              403,
              ErrorCodes.RBAC_PERMISSION_DENIED,
              'Permission denied: Teacher is not assigned to this student\'s active class section.',
            );
          }
        }
      }

      return next();
    }

    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Permission denied: Unauthorized role.',
    );
  } catch (err) {
    next(err);
  }
}
