/**
 * Event & Holiday Calendar RBAC Scoping Middleware — Phase 12
 *
 * Implements teacher audience scoping for events (only assigned classes/sections from TeachingAssignment)
 * and self-service isolation for event reminders.
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Teacher } from '../models/Teacher';
import { EventReminder } from '../models/EventReminder';

/**
 * Enforces teacher event authoring scoping.
 * Teachers can only create/edit events targeted to classes and sections assigned to them via active TeachingAssignment.
 * Teachers cannot create SCHOOL_WIDE events.
 */
export async function enforceTeacherEventScope(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user.role)) {
      next();
      return;
    }

    if (req.user.role === 'TEACHER') {
      const { visibility, targetClassIds = [], targetSectionIds = [] } = req.body;

      if (visibility === 'SCHOOL_WIDE') {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Teachers are not authorized to create or modify SCHOOL_WIDE events'
        );
      }

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

      if (Array.isArray(targetClassIds) && targetClassIds.length > 0) {
        for (const cId of targetClassIds) {
          if (!allowedClassIds.has(cId.toString())) {
            throw new AppError(
              403,
              ErrorCodes.RBAC_PERMISSION_DENIED,
              'Not authorized to create events for an unassigned class'
            );
          }
        }
      }

      if (Array.isArray(targetSectionIds) && targetSectionIds.length > 0) {
        for (const sId of targetSectionIds) {
          if (!allowedSectionIds.has(sId.toString())) {
            throw new AppError(
              403,
              ErrorCodes.RBAC_PERMISSION_DENIED,
              'Not authorized to create events for an unassigned section'
            );
          }
        }
      }

      next();
      return;
    }

    // Other roles not authorized to author school events
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'User role is not authorized to create or modify school events'
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Enforces reminder self-service scoping.
 * Users can only view or cancel their own scheduled event reminders.
 */
export async function enforceReminderSelfServiceScope(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (['SUPER_ADMIN', 'SCHOOL_ADMIN'].includes(req.user.role)) {
      next();
      return;
    }

    const { id } = req.params;
    if (id) {
      const reminder = await EventReminder.findById(id);
      if (reminder && reminder.userId.toString() !== req.user.id) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Not authorized to access or cancel this reminder'
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
