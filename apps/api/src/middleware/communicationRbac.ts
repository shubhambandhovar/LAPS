/**
 * Communication & Notification RBAC Scoping Middleware — Phase 11
 *
 * Implements self-service isolation for user notifications & preferences,
 * and teacher audience scoping to assigned classes/sections from TeachingAssignment.
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Teacher } from '../models/Teacher';
import { Enrollment } from '../models/Enrollment';
import { Notification } from '../models/Notification';

/**
 * Enforces self-service notification scoping: users can only read/mutate their own notifications/preferences,
 * unless they hold SUPER_ADMIN or SCHOOL_ADMIN role.
 */
export async function enforceSelfServiceNotificationScope(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    const { id, userId } = req.params;
    const targetUserId = userId || req.query.userId;

    if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user.role)) {
      next();
      return;
    }

    if (id) {
      const notification = await Notification.findById(id);
      if (notification && notification.recipientId.toString() !== req.user.id) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Not authorized to access or modify this notification'
        );
      }
    }

    if (targetUserId && targetUserId.toString() !== req.user.id) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Not authorized to access or modify preferences for another user'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Enforces teacher notice and notification authoring scoping.
 * Teachers can only target classes and sections assigned to them via active TeachingAssignment.
 */
export async function enforceTeacherNoticeScope(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    // SUPER_ADMIN and SCHOOL_ADMIN can broadcast without restriction
    if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user.role)) {
      next();
      return;
    }

    // If TEACHER, verify targetClassIds and targetSectionIds
    if (req.user.role === 'TEACHER') {
      const { targetClassIds = [], targetSectionIds = [], recipientIds = [] } = req.body;

      const teacherProfile = await Teacher.findOne({
        $or: [{ userId: req.user.id }, { _id: req.user.id }],
      });
      const validTeacherIds = [req.user.id];
      if (teacherProfile) {
        validTeacherIds.push(teacherProfile._id.toString());
      }

      const assignments = await TeachingAssignment.find({
        teacherId: { $in: validTeacherIds },
        status: 'ACTIVE',
      });

      const allowedClassIds = new Set(assignments.map((a) => a.classId.toString()));
      const allowedSectionIds = new Set(assignments.map((a) => a.sectionId.toString()));

      for (const clsId of targetClassIds) {
        if (!allowedClassIds.has(clsId.toString())) {
          throw new AppError(
            403,
            ErrorCodes.RBAC_PERMISSION_DENIED,
            `Teacher is not assigned to class ${clsId}`
          );
        }
      }

      for (const secId of targetSectionIds) {
        if (!allowedSectionIds.has(secId.toString())) {
          throw new AppError(
            403,
            ErrorCodes.RBAC_PERMISSION_DENIED,
            `Teacher is not assigned to section ${secId}`
          );
        }
      }

      if (recipientIds.length > 0) {
        // Verify every recipient is enrolled in an allowed class/section
        const enrollments = await Enrollment.find({
          studentId: { $in: recipientIds },
          status: 'ACTIVE',
        });

        for (const enr of enrollments) {
          if (
            !allowedClassIds.has(enr.classId.toString()) &&
            !allowedSectionIds.has(enr.sectionId.toString())
          ) {
            throw new AppError(
              403,
              ErrorCodes.RBAC_PERMISSION_DENIED,
              `Recipient student ${enr.studentId} is not enrolled in an assigned class/section`
            );
          }
        }
      }

      next();
      return;
    }

    // For other non-admin roles attempting to broadcast notices
    if (req.method !== 'GET') {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Role is not authorized to author notices or send bulk notifications'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
}

export function requireCommAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || !['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user.role)) {
    next(new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Admin access required for communication templates and queues'));
    return;
  }
  next();
}

export function requireCommAdminOrTeacher(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user || !['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user.role)) {
    next(new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Admin or Teacher access required'));
    return;
  }
  next();
}
