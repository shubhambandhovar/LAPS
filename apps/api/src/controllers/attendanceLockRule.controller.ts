import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UpsertAttendanceLockRuleSchema, ErrorCodes } from '@laps/shared';
import { AttendanceLockRule } from '../models/AttendanceLockRule';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/v1/attendance/lock-rules
 * Retrieve active attendance lock rule configuration for an academic session.
 */
export async function getLockRule(req: Request, res: Response): Promise<void> {
  const { academicSessionId } = req.query;

  if (!academicSessionId) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'academicSessionId query parameter is required'
    );
  }

  let rule = await AttendanceLockRule.findOne({
    academicSessionId,
    status: 'ACTIVE',
  });

  if (!rule) {
    // Return default settings if none configured
    rule = new AttendanceLockRule({
      academicSessionId,
      lockAfterHours: 24,
      allowTeacherCorrectionRequest: true,
      adminOverrideEnabled: true,
      status: 'ACTIVE',
    });
  }

  sendSuccess(res, 200, 'Attendance lock rule retrieved successfully', rule);
}

/**
 * PUT /api/v1/attendance/lock-rules
 * Create or update auto-lock rules (lockAfterHours, lockAfterTimeOfDay, admin override settings).
 */
export async function upsertLockRule(req: Request, res: Response): Promise<void> {
  const parsed = UpsertAttendanceLockRuleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid lock rule payload',
      parsed.error.errors
    );
  }

  const {
    academicSessionId,
    lockAfterHours,
    lockAfterTimeOfDay,
    allowTeacherCorrectionRequest,
    adminOverrideEnabled,
    status,
  } = parsed.data;

  let rule = await AttendanceLockRule.findOne({ academicSessionId });

  if (rule) {
    rule.lockAfterHours = lockAfterHours;
    rule.lockAfterTimeOfDay = lockAfterTimeOfDay;
    rule.allowTeacherCorrectionRequest = allowTeacherCorrectionRequest;
    rule.adminOverrideEnabled = adminOverrideEnabled;
    rule.status = status || 'ACTIVE';
    rule.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
    await rule.save();
  } else {
    rule = await AttendanceLockRule.create({
      academicSessionId,
      lockAfterHours,
      lockAfterTimeOfDay,
      allowTeacherCorrectionRequest,
      adminOverrideEnabled,
      status: status || 'ACTIVE',
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
    });
  }

  sendSuccess(res, 200, 'Attendance lock rule configured successfully', rule);
}
