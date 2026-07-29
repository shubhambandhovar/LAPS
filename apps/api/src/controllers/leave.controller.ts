import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  CreateLeaveRequestSchema,
  ReviewLeaveRequestSchema,
  ErrorCodes,
} from '@laps/shared';
import { LeaveRequest } from '../models/LeaveRequest';
import { AttendanceEntry } from '../models/AttendanceEntry';
import { Attendance } from '../models/Attendance';
import { Enrollment } from '../models/Enrollment';
import { Teacher } from '../models/Teacher';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * Helper: Generate array of date strings YYYY-MM-DD between start and end inclusive
 */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const curr = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

/**
 * POST /api/v1/leaves
 * Submit a leave application (applicantType: STUDENT or TEACHER) with date range, controlled leaveType, reason, and optional attachment URL.
 */
export async function createLeaveRequest(req: Request, res: Response): Promise<void> {
  const parsed = CreateLeaveRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid leave request payload',
      parsed.error.errors
    );
  }

  const {
    academicSessionId,
    applicantType,
    studentId,
    enrollmentId,
    teacherId,
    leaveType,
    startDate,
    endDate,
    reason,
    attachmentUrl,
  } = parsed.data;

  const dates = getDateRange(startDate, endDate);
  const totalDays = dates.length;

  const leave = await LeaveRequest.create({
    academicSessionId,
    applicantType,
    studentId: studentId || undefined,
    enrollmentId: enrollmentId || undefined,
    teacherId: teacherId || undefined,
    leaveType,
    startDate,
    endDate,
    totalDays,
    reason,
    attachmentUrl,
    leaveStatus: 'PENDING',
    status: 'ACTIVE',
    createdBy: req.user!.id,
    updatedBy: req.user!.id,
  });

  sendSuccess(res, 201, 'Leave request submitted successfully', leave);
}

/**
 * GET /api/v1/leaves
 * Retrieve paginated leave requests (filterable by student, teacher, class, section, status, date range).
 */
export async function listLeaveRequests(req: Request, res: Response): Promise<void> {
  const { academicSessionId, applicantType, leaveStatus, studentId, teacherId } = req.query;

  const filter: any = { status: 'ACTIVE' };
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  if (applicantType) filter.applicantType = applicantType;
  if (leaveStatus) filter.leaveStatus = leaveStatus;
  if (studentId) filter.studentId = studentId;
  if (teacherId) filter.teacherId = teacherId;

  const leaves = await LeaveRequest.find(filter)
    .populate('studentId', 'firstName lastName admissionNumber rollNumber')
    .populate('teacherId', 'firstName lastName employeeId')
    .populate('reviewedByUserId', 'email')
    .sort({ createdAt: -1 })
    .exec();

  sendSuccess(res, 200, 'Leave requests retrieved successfully', leaves);
}

/**
 * GET /api/v1/leaves/:id
 * Get detailed leave request with reviewer notes.
 */
export async function getLeaveRequestById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const leave = await LeaveRequest.findById(id)
    .populate('studentId', 'firstName lastName admissionNumber rollNumber')
    .populate('teacherId', 'firstName lastName employeeId')
    .populate('reviewedByUserId', 'email');

  if (!leave) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Leave request not found');
  }

  sendSuccess(res, 200, 'Leave request retrieved successfully', leave);
}

/**
 * PATCH /api/v1/leaves/:id/review
 * Admin or Class Teacher approve/reject leave request.
 * When approved for a Student, automatically links to existing AttendanceEntry records with attendanceSource: "LEAVE".
 */
export async function reviewLeaveRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = ReviewLeaveRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid leave review payload',
      parsed.error.errors
    );
  }

  const { leaveStatus, reviewerRemarks } = parsed.data;

  const leave = await LeaveRequest.findById(id);
  if (!leave) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Leave request not found');
  }

  if (leave.leaveStatus !== 'PENDING') {
    throw new AppError(
      400,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      `Leave request is already ${leave.leaveStatus}`
    );
  }

  // RBAC: Teacher leaves can ONLY be reviewed by SCHOOL_ADMIN or SUPER_ADMIN
  if (leave.applicantType === 'TEACHER' && req.user?.role === 'TEACHER') {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Teachers cannot review or approve teacher leave requests'
    );
  }

  // If student leave and user is TEACHER, verify they are Class Teacher for this student
  if (leave.applicantType === 'STUDENT' && req.user?.role === 'TEACHER') {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      throw new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Teacher profile not found');
    }
    const enrollment = await Enrollment.findById(leave.enrollmentId);
    if (!enrollment) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Student enrollment not found');
    }
    const assignment = await TeachingAssignment.findOne({
      academicSessionId: leave.academicSessionId,
      classId: enrollment.classId,
      sectionId: enrollment.sectionId,
      teacherId: teacher._id,
      isClassTeacher: true,
      status: 'ACTIVE',
    });
    if (!assignment) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Only the assigned Class Teacher or Admin can approve this student leave'
      );
    }
  }

  // When approved for a Student, automatically link to existing or future AttendanceEntry records
  if (leaveStatus === 'APPROVED' && leave.applicantType === 'STUDENT' && leave.studentId) {
    const dates = getDateRange(leave.startDate, leave.endDate);
    const targetStatus = leave.leaveType === 'MEDICAL' ? 'MEDICAL_LEAVE' : 'APPROVED_LEAVE';

    for (const dateStr of dates) {
      // Check if an AttendanceEntry exists for this student on this date
      const existingEntries = await AttendanceEntry.find({
        academicSessionId: leave.academicSessionId,
        studentId: leave.studentId,
        date: dateStr,
      });

      for (const entry of existingEntries) {
        entry.statusHistory.push({
          oldStatus: entry.attendanceStatus,
          newStatus: targetStatus,
          changedBy: String(req.user!.id),
          changedAt: new Date().toISOString(),
          reason: `Approved student leave (${leave.leaveType})`,
        });

        entry.attendanceStatus = targetStatus;
        entry.attendanceSource = 'LEAVE';
        entry.leaveRequestId = leave._id;
        entry.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
        await entry.save();
      }

      // If no entry exists yet, check if there is an existing Attendance session for that section and date
      if (existingEntries.length === 0 && leave.enrollmentId) {
        const enrollment: any = await Enrollment.findById(leave.enrollmentId)
          .populate('studentId')
          .populate('classId')
          .populate('sectionId');
        if (enrollment) {
          const clsId = enrollment.classId?._id || enrollment.classId;
          const secId = enrollment.sectionId?._id || enrollment.sectionId;
          const clsName = enrollment.classId?.name || 'Class';
          const secName = enrollment.sectionId?.name || 'Section';

          let sessions = await Attendance.find({
            academicSessionId: leave.academicSessionId,
            classId: clsId,
            sectionId: secId,
            date: dateStr,
          });

          if (sessions.length === 0) {
            const assignment = await TeachingAssignment.findOne({
              academicSessionId: leave.academicSessionId,
              classId: clsId,
              sectionId: secId,
              isClassTeacher: true,
              status: 'ACTIVE',
            });
            if (assignment) {
              const newSession = await Attendance.create({
                academicSessionId: leave.academicSessionId,
                classId: clsId,
                sectionId: secId,
                attendanceType: 'DAILY',
                date: dateStr,
                teachingAssignmentId: assignment._id,
                markedByUserId: req.user!.id,
                sessionStatus: 'DRAFT',
                isLocked: false,
                isFrozen: false,
                status: 'ACTIVE',
                createdBy: req.user!.id,
                updatedBy: req.user!.id,
              });
              sessions = [newSession];
            }
          }

          for (const session of sessions) {
            await AttendanceEntry.create({
              attendanceId: session._id,
              academicSessionId: leave.academicSessionId,
              enrollmentId: enrollment._id,
              studentId: leave.studentId,
              classId: clsId,
              sectionId: secId,
              studentName: `${enrollment.studentId?.firstName || ''} ${enrollment.studentId?.lastName || ''}`.trim(),
              rollNumber: enrollment.rollNumber || '',
              className: clsName,
              sectionName: secName,
              date: dateStr,
              attendanceStatus: targetStatus,
              attendanceSource: 'LEAVE',
              lateMinutes: 0,
              leaveRequestId: leave._id,
              statusHistory: [
                {
                  oldStatus: 'NONE',
                  newStatus: targetStatus,
                  changedBy: String(req.user!.id),
                  changedAt: new Date().toISOString(),
                  reason: `Approved student leave (${leave.leaveType})`,
                },
              ],
              status: 'ACTIVE',
              createdBy: req.user!.id,
              updatedBy: req.user!.id,
            });
          }
        }
      }
    }
  }

  leave.leaveStatus = leaveStatus;
  leave.reviewedByUserId = new mongoose.Types.ObjectId(req.user!.id);
  leave.reviewedAt = new Date();
  if (reviewerRemarks) leave.reviewerRemarks = reviewerRemarks;
  leave.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
  await leave.save();

  sendSuccess(res, 200, `Leave request ${leaveStatus.toLowerCase()} successfully`, leave);
}

/**
 * PATCH /api/v1/leaves/:id/cancel
 * Applicant cancels pending leave application.
 */
export async function cancelLeaveRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const leave = await LeaveRequest.findById(id);

  if (!leave) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Leave request not found');
  }

  if (leave.leaveStatus !== 'PENDING') {
    throw new AppError(
      400,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      'Only pending leave requests can be cancelled'
    );
  }

  leave.leaveStatus = 'CANCELLED';
  leave.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
  await leave.save();

  sendSuccess(res, 200, 'Leave request cancelled successfully', leave);
}

/**
 * PATCH /api/v1/leaves/:id/archive
 * Soft-archive leave request.
 */
export async function archiveLeaveRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const leave = await LeaveRequest.findById(id);

  if (!leave) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Leave request not found');
  }

  leave.status = 'ARCHIVED';
  leave.archivedBy = new mongoose.Types.ObjectId(req.user!.id);
  leave.archivedAt = new Date();
  await leave.save();

  sendSuccess(res, 200, 'Leave request archived successfully', leave);
}
