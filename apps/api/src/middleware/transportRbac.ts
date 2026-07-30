/**
 * Transport, Fleet & GPS Tracking RBAC Scoping Middleware — Phase 13
 *
 * Implements strict scoping for:
 * 1. Students & Guardians: Can view only their own / ward's assigned transport information.
 * 2. Teachers: Can view transport details only for students in their assigned classes/sections.
 * 3. Drivers: Restricted to telemetry submission for their assigned vehicle/profile.
 */

import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Teacher } from '../models/Teacher';
import { StudentGuardian } from '../models/StudentGuardian';
import { Guardian } from '../models/Guardian';
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';

/**
 * Enforces Student and Guardian isolation for transport assignments and live GPS queries.
 */
export async function enforceTransportStudentScope(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TRANSPORT_MANAGER', 'TEACHER'].includes(req.user.role)) {
      next();
      return;
    }

    const requestedStudentId =
      (req.query.studentId as string) ||
      (req.params.studentId as string) ||
      (req.body.studentId as string);

    if (req.user.role === 'STUDENT') {
      const studentProfile = await Student.findOne({
        $or: [{ userId: req.user.id }, { _id: req.user.id }],
      });

      const validIds = [req.user.id];
      if (req.user.profileRef) {
        validIds.push(req.user.profileRef);
      }
      if (studentProfile) {
        validIds.push(studentProfile._id.toString());
      }

      if (requestedStudentId && !validIds.includes(requestedStudentId.toString())) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'You can only access transport information for your own profile',
        );
      }
      next();
      return;
    }

    if (req.user.role === 'GUARDIAN') {
      if (requestedStudentId) {
        const guardianProfile = await Guardian.findOne({
          $or: [{ userId: req.user.id }, { _id: req.user.id }],
        });

        const guardianIds = [req.user.id];
        if (req.user.profileRef) {
          guardianIds.push(req.user.profileRef);
        }
        if (guardianProfile) {
          guardianIds.push(guardianProfile._id.toString());
        }

        const link = await StudentGuardian.findOne({
          guardianId: { $in: guardianIds },
          studentId: requestedStudentId,
        });

        if (!link) {
          throw new AppError(
            403,
            ErrorCodes.RBAC_PERMISSION_DENIED,
            "You can only access transport information for your ward's profile",
          );
        }
      }
      next();
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Enforces Teacher scoping for transport assignments (bus duty and dismissal supervision).
 * Teachers can only view assignments for students enrolled in classes/sections where they teach.
 * Rejects administrative mutations by Teachers.
 */
export async function enforceTransportTeacherScope(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TRANSPORT_MANAGER'].includes(req.user.role)) {
      next();
      return;
    }

    if (req.user.role === 'TEACHER') {
      // Teachers cannot mutate transport records
      if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Teachers are not authorized to modify transport records',
        );
      }

      const requestedClassId = (req.query.classId as string) || (req.params.classId as string);
      const requestedSectionId = (req.query.sectionId as string) || (req.params.sectionId as string);
      const requestedStudentId = (req.query.studentId as string) || (req.params.studentId as string);

      const teacherProfile = await Teacher.findOne({
        $or: [{ userId: req.user.id }, { _id: req.user.id }],
      });

      const validTeacherIds = [req.user.id];
      if (req.user.profileRef) {
        validTeacherIds.push(req.user.profileRef);
      }
      if (teacherProfile) {
        validTeacherIds.push(teacherProfile._id.toString());
      }

      const assignments = await TeachingAssignment.find({
        teacherId: { $in: validTeacherIds },
        status: 'ACTIVE',
      });

      const allowedClassIds = new Set(assignments.map((a) => a.classId.toString()));
      const allowedSectionIds = new Set(assignments.map((a) => a.sectionId.toString()));

      if (requestedClassId && !allowedClassIds.has(requestedClassId.toString())) {
        console.log('--- DEBUG transportRbac ---', {
          reqUserId: req.user.id,
          teacherProfile: teacherProfile?._id,
          validTeacherIds,
          assignments: assignments.map(a => a._id),
          allowedClassIds: Array.from(allowedClassIds),
          requestedClassId
        });
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Teachers can only view transport assignments for their assigned classes',
        );
      }

      if (requestedSectionId && !allowedSectionIds.has(requestedSectionId.toString())) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Teachers can only view transport assignments for their assigned sections',
        );
      }

      if (requestedStudentId) {
        // Verify that the student is enrolled in one of the teacher's classes
        const enrollment = await Enrollment.findOne({
          studentId: requestedStudentId,
          status: 'ACTIVE',
        });
        if (
          enrollment &&
          !allowedClassIds.has(enrollment.classId.toString()) &&
          !allowedSectionIds.has(enrollment.sectionId.toString())
        ) {
          throw new AppError(
            403,
            ErrorCodes.RBAC_PERMISSION_DENIED,
            'Teachers can only view transport assignments for students in their assigned classes',
          );
        }
      }

      next();
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Enforces Driver scoping for telemetry submissions and live tracking.
 */
export async function enforceDriverVehicleScope(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required');
    }

    if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TRANSPORT_MANAGER'].includes(req.user.role)) {
      next();
      return;
    }

    if (req.user.role === 'DRIVER') {
      const { driverId } = req.body;
      const validIds = [req.user.id];
      if (req.user.profileRef) validIds.push(req.user.profileRef);

      const driverProfile = await import('../models/Driver').then((m) =>
        m.Driver.findOne({ $or: [{ userId: req.user?.id }, { _id: req.user?.id }] })
      );
      if (driverProfile) validIds.push(driverProfile._id.toString());

      if (driverId && !validIds.includes(driverId.toString())) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Drivers can only submit telemetry for their own assigned driver profile',
        );
      }
      next();
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
}
