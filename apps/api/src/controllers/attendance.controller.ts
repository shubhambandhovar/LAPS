import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  CreateAttendanceBatchSchema,
  CreateBulkAttendanceSchema,
  ReopenAttendanceSchema,
  ErrorCodes,
} from '@laps/shared';
import { Attendance } from '../models/Attendance';
import { AttendanceEntry } from '../models/AttendanceEntry';
import { Holiday } from '../models/Holiday';
import { AcademicCalendarEvent } from '../models/AcademicCalendarEvent';
import { Timetable } from '../models/Timetable';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Enrollment } from '../models/Enrollment';
import { Teacher } from '../models/Teacher';
import { Class } from '../models/Class';

import { Section } from '../models/Section';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * Helper: Parse YYYY-MM-DD into MONDAY ... SUNDAY string
 */
function getDayOfWeekFromDate(dateStr: string): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const d = new Date(dateStr + 'T00:00:00Z');
  return days[d.getUTCDay()] || 'MONDAY';
}

/**
 * Helper: Check for holidays or emergency closures affecting attendance on a date
 */
async function checkHolidayOrEmergencyClosure(academicSessionId: string, dateStr: string): Promise<void> {
  const holiday = await Holiday.findOne({
    academicSessionId,
    startDate: { $lte: dateStr },
    endDate: { $gte: dateStr },
    affectsAttendance: true,
    status: 'ACTIVE',
  });
  if (holiday) {
    throw new AppError(
      409,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      `Cannot mark attendance on an official holiday: ${holiday.title}`
    );
  }

  const closureEvent = await AcademicCalendarEvent.findOne({
    academicSessionId,
    eventType: 'EMERGENCY_CLOSURE',
    startDate: { $lte: dateStr },
    endDate: { $gte: dateStr },
    status: 'ACTIVE',
  });
  if (closureEvent) {
    throw new AppError(
      409,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      `School is closed due to emergency closure: ${closureEvent.title}`
    );
  }
}

/**
 * GET /api/v1/attendance/session-context
 * Resolves Teacher, current period, subject, and student roster using PUBLISHED Timetable.
 */
export async function getSessionContext(req: Request, res: Response): Promise<void> {
  const { academicSessionId, date, classId, sectionId, attendanceType, timetablePeriodId } = req.query;

  if (!academicSessionId || !date || !classId || !sectionId) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'academicSessionId, date, classId, and sectionId are required'
    );
  }

  await checkHolidayOrEmergencyClosure(String(academicSessionId), String(date));

  const dayOfWeek = getDayOfWeekFromDate(String(date));
  let teachingAssignmentId: string | undefined;
  let subjectId: string | undefined;

  if (attendanceType === 'PERIOD') {
    if (!timetablePeriodId) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'timetablePeriodId is required for PERIOD attendance'
      );
    }
    const timetableSlot = await Timetable.findOne({
      academicSessionId,
      classId,
      sectionId,
      timetablePeriodId,
      dayOfWeek,
      status: 'PUBLISHED',
    });

    if (!timetableSlot) {
      throw new AppError(
        409,
        ErrorCodes.BUSINESS_RULE_VIOLATION,
        'Cannot mark attendance for an unpublished or archived timetable period'
      );
    }

    if (req.user?.role === 'TEACHER') {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || String(timetableSlot.teacherId) !== String(teacher._id)) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Not authorized to mark attendance for this section/subject'
        );
      }
    }
    teachingAssignmentId = String(timetableSlot.teachingAssignmentId);
    subjectId = String(timetableSlot.subjectId);
  } else {
    // DAILY attendance
    const assignment = await TeachingAssignment.findOne({
      academicSessionId,
      classId,
      sectionId,
      isClassTeacher: true,
      status: 'ACTIVE',
    });

    if (!assignment) {
      throw new AppError(
        404,
        ErrorCodes.RESOURCE_NOT_FOUND,
        'No Class Teacher assignment found for this section'
      );
    }

    if (req.user?.role === 'TEACHER') {
      const teacher = await Teacher.findOne({ userId: req.user.id });
      if (!teacher || String(assignment.teacherId) !== String(teacher._id)) {
        throw new AppError(
          403,
          ErrorCodes.RBAC_PERMISSION_DENIED,
          'Not authorized to mark daily attendance for this section'
        );
      }
    }
    teachingAssignmentId = String(assignment._id);
  }

  const enrollments = await Enrollment.find({
    academicSessionId,
    classId,
    sectionId,
    status: 'ACTIVE',
  })
    .populate('studentId', 'firstName lastName admissionNumber rollNumber')
    .sort({ rollNumber: 1 })
    .exec();

  const classDoc = await Class.findById(classId);
  const sectionDoc = await Section.findById(sectionId);

  sendSuccess(res, 200, 'Attendance session context retrieved successfully', {
    academicSessionId,
    date,
    dayOfWeek,
    classId,
    className: classDoc?.name || '',
    sectionId,
    sectionName: sectionDoc?.name || '',
    attendanceType: attendanceType || 'DAILY',
    timetablePeriodId: timetablePeriodId || null,
    subjectId: subjectId || null,
    teachingAssignmentId,
    roster: enrollments.map((enr: any) => ({
      enrollmentId: enr._id,
      studentId: enr.studentId?._id || enr.studentId,
      studentName: `${enr.studentId?.firstName || ''} ${enr.studentId?.lastName || ''}`.trim(),
      rollNumber: enr.rollNumber || enr.studentId?.rollNumber || '',
    })),
  });
}

/**
 * POST /api/v1/attendance
 * Mark or update an attendance batch for a class/section/period (creates session in DRAFT state).
 */
export async function markAttendanceBatch(req: Request, res: Response): Promise<void> {
  const parsed = CreateAttendanceBatchSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid attendance batch payload',
      parsed.error.errors
    );
  }

  const {
    academicSessionId,
    classId,
    sectionId,
    attendanceType,
    date,
    timetablePeriodId,
    subjectId,
    teachingAssignmentId,
    sessionStatus,
    entries,
  } = parsed.data;

  await checkHolidayOrEmergencyClosure(academicSessionId, date);

  if (attendanceType === 'PERIOD') {
    if (!timetablePeriodId) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'timetablePeriodId required for PERIOD attendance');
    }
    const dayOfWeek = getDayOfWeekFromDate(date);
    const slot = await Timetable.findOne({
      academicSessionId,
      classId,
      sectionId,
      timetablePeriodId,
      dayOfWeek,
      status: 'PUBLISHED',
    });
    if (!slot) {
      throw new AppError(
        409,
        ErrorCodes.BUSINESS_RULE_VIOLATION,
        'Cannot mark attendance for an unpublished or archived timetable period'
      );
    }
  }

  // Teacher RBAC check
  if (req.user?.role === 'TEACHER') {
    const teacher = await Teacher.findOne({ userId: req.user.id });
    if (!teacher) {
      throw new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Teacher profile not found');
    }
    const assignment = await TeachingAssignment.findById(teachingAssignmentId);
    if (!assignment || String(assignment.teacherId) !== String(teacher._id)) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Not authorized to mark attendance for this section/subject'
      );
    }
  }

  // Find or create Attendance Session
  const filter: any = {
    academicSessionId,
    classId,
    sectionId,
    date,
    attendanceType,
  };
  if (timetablePeriodId) {
    filter.timetablePeriodId = timetablePeriodId;
  } else {
    filter.timetablePeriodId = { $exists: false };
  }

  let session = await Attendance.findOne(filter);

  if (session) {
    if (session.isFrozen || session.sessionStatus === 'FROZEN') {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Attendance session is frozen due to report card generation'
      );
    }
    if ((session.isLocked || session.sessionStatus === 'LOCKED') && req.user?.role === 'TEACHER') {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'Attendance session is locked'
      );
    }
    session.sessionStatus = sessionStatus || 'DRAFT';
    session.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
    await session.save();
  } else {
    session = await Attendance.create({
      academicSessionId,
      classId,
      sectionId,
      attendanceType,
      date,
      timetablePeriodId: timetablePeriodId || undefined,
      subjectId: subjectId || undefined,
      teachingAssignmentId,
      sessionStatus: sessionStatus || 'DRAFT',
      markedByUserId: req.user!.id,
      markedAt: new Date(),
      isLocked: false,
      isFrozen: false,
      status: 'ACTIVE',
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
    });
  }

  // Process entries
  const resultEntries = [];
  for (const entryInput of entries) {
    let entry = await AttendanceEntry.findOne({
      attendanceId: session._id,
      studentId: entryInput.studentId,
    });

    if (entry) {
      if (entry.attendanceStatus !== entryInput.attendanceStatus) {
        entry.statusHistory.push({
          oldStatus: entry.attendanceStatus,
          newStatus: entryInput.attendanceStatus,
          changedBy: String(req.user!.id),
          changedAt: new Date().toISOString(),
          reason: 'Teacher attendance update',
        });
      }
      entry.attendanceStatus = entryInput.attendanceStatus;
      entry.attendanceSource = entryInput.attendanceSource;
      entry.lateMinutes = entryInput.lateMinutes || 0;
      entry.remarks = entryInput.remarks;
      entry.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
      await entry.save();
      resultEntries.push(entry);
    } else {
      entry = await AttendanceEntry.create({
        attendanceId: session._id,
        academicSessionId,
        enrollmentId: entryInput.enrollmentId,
        studentId: entryInput.studentId,
        classId,
        sectionId,
        studentName: entryInput.studentName,
        rollNumber: entryInput.rollNumber,
        className: entryInput.className,
        sectionName: entryInput.sectionName,
        date,
        attendanceStatus: entryInput.attendanceStatus,
        attendanceSource: entryInput.attendanceSource,
        lateMinutes: entryInput.lateMinutes || 0,
        remarks: entryInput.remarks,
        statusHistory: [
          {
            oldStatus: 'NONE',
            newStatus: entryInput.attendanceStatus,
            changedBy: String(req.user!.id),
            changedAt: new Date().toISOString(),
            reason: 'Initial entry',
          },
        ],
        status: 'ACTIVE',
        createdBy: req.user!.id,
        updatedBy: req.user!.id,
      });
      resultEntries.push(entry);
    }
  }

  sendSuccess(res, 200, 'Attendance marked successfully', {
    session,
    entries: resultEntries,
  });
}

/**
 * POST /api/v1/attendance/:id/submit
 * Transition attendance session lifecycle from DRAFT to SUBMITTED.
 */
export async function submitAttendance(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const session = await Attendance.findById(id);

  if (!session) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Attendance session not found');
  }

  if (session.isFrozen || session.sessionStatus === 'FROZEN') {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Attendance session is frozen due to report card generation'
    );
  }

  if (session.isLocked || session.sessionStatus === 'LOCKED') {
    if (req.user?.role === 'TEACHER') {
      throw new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Attendance session is locked');
    }
  }

  session.sessionStatus = 'SUBMITTED';
  session.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
  await session.save();

  sendSuccess(res, 200, 'Attendance session submitted successfully', session);
}

/**
 * POST /api/v1/attendance/bulk
 * Bulk mark attendance across multiple sections or periods.
 */
export async function bulkMarkAttendance(req: Request, res: Response): Promise<void> {
  const parsed = CreateBulkAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid bulk attendance payload',
      parsed.error.errors
    );
  }

  const { batches } = parsed.data;
  const results = [];

  for (const batch of batches) {
    // Re-use internal saving logic for each batch
    await checkHolidayOrEmergencyClosure(batch.academicSessionId, batch.date);

    const filter: any = {
      academicSessionId: batch.academicSessionId,
      classId: batch.classId,
      sectionId: batch.sectionId,
      date: batch.date,
      attendanceType: batch.attendanceType,
    };
    if (batch.timetablePeriodId) {
      filter.timetablePeriodId = batch.timetablePeriodId;
    } else {
      filter.timetablePeriodId = { $exists: false };
    }

    let session = await Attendance.findOne(filter);
    if (!session) {
      session = await Attendance.create({
        academicSessionId: batch.academicSessionId,
        classId: batch.classId,
        sectionId: batch.sectionId,
        attendanceType: batch.attendanceType,
        date: batch.date,
        timetablePeriodId: batch.timetablePeriodId || undefined,
        subjectId: batch.subjectId || undefined,
        teachingAssignmentId: batch.teachingAssignmentId,
        sessionStatus: batch.sessionStatus || 'DRAFT',
        markedByUserId: req.user!.id,
        markedAt: new Date(),
        isLocked: false,
        isFrozen: false,
        status: 'ACTIVE',
        createdBy: req.user!.id,
        updatedBy: req.user!.id,
      });
    }

    for (const entryInput of batch.entries) {
      const entry = await AttendanceEntry.findOne({
        attendanceId: session._id,
        studentId: entryInput.studentId,
      });
      if (entry) {
        entry.attendanceStatus = entryInput.attendanceStatus;
        entry.attendanceSource = entryInput.attendanceSource;
        entry.lateMinutes = entryInput.lateMinutes || 0;
        entry.remarks = entryInput.remarks;
        entry.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
        await entry.save();
      } else {
        await AttendanceEntry.create({
          attendanceId: session._id,
          academicSessionId: batch.academicSessionId,
          enrollmentId: entryInput.enrollmentId,
          studentId: entryInput.studentId,
          classId: batch.classId,
          sectionId: batch.sectionId,
          studentName: entryInput.studentName,
          rollNumber: entryInput.rollNumber,
          className: entryInput.className,
          sectionName: entryInput.sectionName,
          date: batch.date,
          attendanceStatus: entryInput.attendanceStatus,
          attendanceSource: entryInput.attendanceSource,
          lateMinutes: entryInput.lateMinutes || 0,
          remarks: entryInput.remarks,
          statusHistory: [
            {
              oldStatus: 'NONE',
              newStatus: entryInput.attendanceStatus,
              changedBy: String(req.user!.id),
              changedAt: new Date().toISOString(),
              reason: 'Bulk attendance marking',
            },
          ],
          status: 'ACTIVE',
          createdBy: req.user!.id,
          updatedBy: req.user!.id,
        });
      }
    }
    results.push(session._id);
  }

  sendSuccess(res, 201, 'Bulk attendance marked successfully', {
    processedBatches: results.length,
    sessionIds: results,
  });
}

/**
 * GET /api/v1/attendance/register
 * Retrieve structured daily, weekly, monthly, or yearly attendance register matrix.
 */
export async function getAttendanceRegister(req: Request, res: Response): Promise<void> {
  const {
    academicSessionId,
    frequency = 'MONTHLY',
    startDate,
    endDate,
    classId,
    sectionId,
    studentId,
    teacherId,
    attendanceType,
  } = req.query;

  if (!academicSessionId || !startDate || !endDate) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'academicSessionId, startDate, and endDate are required'
    );
  }

  // Build query
  const query: any = {
    academicSessionId,
    date: { $gte: String(startDate), $lte: String(endDate) },
    status: 'ACTIVE',
  };

  if (classId) query.classId = classId;
  if (sectionId) query.sectionId = sectionId;
  if (studentId) query.studentId = studentId;
  if (attendanceType) query.attendanceType = attendanceType;


  if (req.user?.role === 'TEACHER' || teacherId) {
    let tId = teacherId;
    if (!tId && req.user?.role === 'TEACHER') {
      const teacherDoc = await Teacher.findOne({ userId: req.user.id });
      if (teacherDoc) {
        tId = String(teacherDoc._id);
      } else {
        tId = req.user.id;
      }
    }
    const assignments = await TeachingAssignment.find({
      academicSessionId,
      teacherId: tId,
      status: 'ACTIVE',
    });
    const sectionIds = assignments.map((a: any) => a.sectionId);
    query.sectionId = { $in: sectionIds };
  }


  const entries = await AttendanceEntry.find(query).sort({ studentId: 1, date: 1 }).exec();

  // Group by student
  const studentMap = new Map<string, any>();
  for (const entry of entries) {
    const sId = String(entry.studentId);
    if (!studentMap.has(sId)) {
      studentMap.set(sId, {
        studentId: sId,
        enrollmentId: String(entry.enrollmentId),
        studentName: entry.studentName,
        rollNumber: entry.rollNumber || '',
        className: entry.className,
        sectionName: entry.sectionName,
        records: [],
        summary: {
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          medicalLeave: 0,
          approvedLeave: 0,
          percentage: 0,
        },
      });
    }

    const item = studentMap.get(sId);
    item.records.push({
      date: entry.date,
      status: entry.attendanceStatus,
      attendanceSource: entry.attendanceSource,
      lateMinutes: entry.lateMinutes,
      remarks: entry.remarks,
    });

    // Update summary counts
    item.summary.totalDays += 1;
    switch (entry.attendanceStatus) {
      case 'PRESENT':
        item.summary.present += 1;
        break;
      case 'ABSENT':
      case 'UNAPPROVED_LEAVE':
        item.summary.absent += 1;
        break;
      case 'LATE':
        item.summary.late += 1;
        item.summary.present += 1; // Late counts towards present
        break;
      case 'HALF_DAY':
        item.summary.halfDay += 1;
        item.summary.present += 0.5; // Half day counts as 0.5 present
        break;
      case 'MEDICAL_LEAVE':
        item.summary.medicalLeave += 1;
        item.summary.present += 1; // Medical leave counts as excused/present in % calculation
        break;
      case 'APPROVED_LEAVE':
      case 'EXCUSED':
        item.summary.approvedLeave += 1;
        item.summary.present += 1;
        break;
    }
  }

  // Calculate percentage
  const rows = Array.from(studentMap.values()).map((row) => {
    if (row.summary.totalDays > 0) {
      row.summary.percentage = Number(
        ((row.summary.present / row.summary.totalDays) * 100).toFixed(2)
      );
    }
    return row;
  });

  sendSuccess(res, 200, 'Attendance register retrieved successfully', {
    academicSessionId,
    frequency,
    startDate,
    endDate,
    totalStudents: rows.length,
    rows,
  });
}

/**
 * PATCH /api/v1/attendance/:id/lock
 * Manually lock an attendance session (sessionStatus: "LOCKED" — Admin only).
 */
export async function toggleLockSession(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const session = await Attendance.findById(id);

  if (!session) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Attendance session not found');
  }

  if (session.isFrozen || session.sessionStatus === 'FROZEN') {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Attendance session is frozen due to report card generation'
    );
  }

  session.isLocked = true;
  session.sessionStatus = 'LOCKED';
  session.lockedByUserId = new mongoose.Types.ObjectId(req.user!.id);
  session.lockedAt = new Date();
  session.lockReason = 'Admin manual lock';
  session.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
  await session.save();

  sendSuccess(res, 200, 'Attendance session locked successfully', session);
}

/**
 * PATCH /api/v1/attendance/:id/freeze
 * Freeze attendance session (sessionStatus: "FROZEN" — invoked after report-card generation).
 */
export async function freezeAttendanceSession(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const session = await Attendance.findById(id);

  if (!session) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Attendance session not found');
  }

  session.isFrozen = true;
  session.sessionStatus = 'FROZEN';
  session.frozenByUserId = new mongoose.Types.ObjectId(req.user!.id);
  session.frozenAt = new Date();
  session.freezeReason = 'Report card generated for term/session';
  session.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
  await session.save();

  sendSuccess(res, 200, 'Attendance session frozen successfully', session);
}

/**
 * PATCH /api/v1/attendance/:id/reopen
 * Reopen a frozen attendance session (FROZEN -> LOCKED / SUBMITTED — Admin only, requires mandatory audit reason).
 */
export async function reopenAttendanceSession(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = ReopenAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Mandatory audit reason required to reopen frozen attendance',
      parsed.error.errors
    );
  }

  const session = await Attendance.findById(id);

  if (!session) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Attendance session not found');
  }

  if (!session.isFrozen && session.sessionStatus !== 'FROZEN') {
    throw new AppError(400, ErrorCodes.BUSINESS_RULE_VIOLATION, 'Attendance session is not frozen');
  }

  session.isFrozen = false;
  session.sessionStatus = session.isLocked ? 'LOCKED' : 'SUBMITTED';
  session.freezeReason = `Reopened by Admin (${req.user!.id}): ${parsed.data.reason}`;
  session.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
  await session.save();

  sendSuccess(res, 200, 'Frozen attendance session reopened successfully', session);
}

/**
 * PATCH /api/v1/attendance/:id/archive
 * Soft-archive an attendance session and its entries.
 */
export async function archiveAttendance(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const session = await Attendance.findById(id);

  if (!session) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Attendance session not found');
  }

  session.status = 'ARCHIVED';
  session.archivedBy = new mongoose.Types.ObjectId(req.user!.id);
  session.archivedAt = new Date();
  await session.save();

  await AttendanceEntry.updateMany(
    { attendanceId: session._id },
    {
      $set: {
        status: 'ARCHIVED',
        archivedBy: req.user!.id,
        archivedAt: new Date(),
      },
    }
  );

  sendSuccess(res, 200, 'Attendance session archived successfully', session);
}
