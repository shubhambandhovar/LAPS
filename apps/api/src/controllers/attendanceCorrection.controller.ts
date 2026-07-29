import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  CreateAttendanceCorrectionSchema,
  ReviewAttendanceCorrectionSchema,
  ErrorCodes,
} from '@laps/shared';
import { AttendanceCorrection } from '../models/AttendanceCorrection';
import { AttendanceEntry } from '../models/AttendanceEntry';
import { Attendance } from '../models/Attendance';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * POST /api/v1/attendance/corrections
 * Submit a formal correction request by a Teacher or Admin to change an attendance entry after submission or lock. Requires mandatory reason.
 */
export async function createCorrectionRequest(req: Request, res: Response): Promise<void> {
  const parsed = CreateAttendanceCorrectionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid attendance correction request',
      parsed.error.errors
    );
  }

  const {
    academicSessionId,
    attendanceId,
    attendanceEntryId,
    studentId,
    newStatus,
    reason,
  } = parsed.data;

  const session = await Attendance.findById(attendanceId);
  if (!session) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Attendance session not found');
  }

  if (session.isFrozen || session.sessionStatus === 'FROZEN') {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Attendance session is frozen due to report card generation. Correction requests cannot be submitted.'
    );
  }

  const entry = await AttendanceEntry.findById(attendanceEntryId);
  if (!entry || String(entry.attendanceId) !== String(session._id)) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Attendance entry not found');
  }

  if (entry.attendanceStatus === newStatus) {
    throw new AppError(
      400,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      'New status must be different from current attendance status'
    );
  }

  const correction = await AttendanceCorrection.create({
    academicSessionId,
    attendanceId,
    attendanceEntryId,
    studentId,
    requestedByUserId: req.user!.id,
    oldStatus: entry.attendanceStatus,
    newStatus,
    reason,
    correctionStatus: 'PENDING',
    status: 'ACTIVE',
    createdBy: req.user!.id,
    updatedBy: req.user!.id,
  });

  sendSuccess(res, 201, 'Attendance correction request created successfully', correction);
}

/**
 * GET /api/v1/attendance/corrections
 * List pending, approved, or rejected correction requests (filterable by class, section, teacher, status).
 */
export async function listCorrectionRequests(req: Request, res: Response): Promise<void> {
  const { academicSessionId, correctionStatus, studentId } = req.query;

  const filter: any = { status: 'ACTIVE' };
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  if (correctionStatus) filter.correctionStatus = correctionStatus;
  if (studentId) filter.studentId = studentId;

  if (req.user?.role === 'TEACHER') {
    filter.requestedByUserId = req.user.id;
  }

  const corrections = await AttendanceCorrection.find(filter)
    .populate('studentId', 'firstName lastName admissionNumber rollNumber')
    .populate('requestedByUserId', 'email')
    .populate('reviewedByUserId', 'email')
    .sort({ createdAt: -1 })
    .exec();

  sendSuccess(res, 200, 'Attendance correction requests retrieved successfully', corrections);
}

/**
 * PATCH /api/v1/attendance/corrections/:id/review
 * Admin approve or reject a correction request. When approved, automatically mutates AttendanceEntry.attendanceStatus and appends to statusHistory.
 */
export async function reviewCorrectionRequest(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parsed = ReviewAttendanceCorrectionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid correction review payload',
      parsed.error.errors
    );
  }

  const { correctionStatus, reviewerRemarks } = parsed.data;

  const correction = await AttendanceCorrection.findById(id);
  if (!correction) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Attendance correction request not found');
  }

  if (correction.correctionStatus !== 'PENDING') {
    throw new AppError(
      400,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      `Correction request is already ${correction.correctionStatus}`
    );
  }

  const session = await Attendance.findById(correction.attendanceId);
  if (session && (session.isFrozen || session.sessionStatus === 'FROZEN')) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Attendance session is frozen due to report card generation. Correction request cannot be approved.'
    );
  }

  if (correctionStatus === 'APPROVED') {
    const entry = await AttendanceEntry.findById(correction.attendanceEntryId);
    if (!entry) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Associated attendance entry not found');
    }

    entry.statusHistory.push({
      oldStatus: entry.attendanceStatus,
      newStatus: correction.newStatus,
      changedBy: String(req.user!.id),
      changedAt: new Date().toISOString(),
      reason: `Approved correction: ${correction.reason}`,
    });

    entry.attendanceStatus = correction.newStatus;
    entry.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
    await entry.save();
  }

  correction.correctionStatus = correctionStatus;
  correction.reviewedByUserId = new mongoose.Types.ObjectId(req.user!.id);
  correction.reviewedAt = new Date();
  if (reviewerRemarks) correction.reviewerRemarks = reviewerRemarks;
  correction.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
  await correction.save();

  sendSuccess(res, 200, `Attendance correction request ${correctionStatus.toLowerCase()} successfully`, correction);
}
