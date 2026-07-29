import { Request, Response } from 'express';
import {
  CreateBellScheduleSchema,
  UpdateBellScheduleSchema,
  CreateTimetablePeriodSchema,
  UpdateTimetablePeriodSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { BellSchedule } from '../models/BellSchedule';
import { TimetablePeriod } from '../models/TimetablePeriod';
import { AcademicSession } from '../models/AcademicSession';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

// BellSchedule Handlers
export async function getBellSchedules(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '20'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.scheduleType) {
    filter.scheduleType = req.query.scheduleType;
  }
  if (req.query.scopeType) {
    filter.scopeType = req.query.scopeType;
  }
  if (req.query.targetClassId) {
    filter.targetClassIds = req.query.targetClassId;
  }
  if (req.query.isDefault !== undefined) {
    filter.isDefault = req.query.isDefault === 'true';
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search), 'i');
    filter.name = searchRegex;
  }

  const sortBy = String(req.query.sortBy || 'name');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    BellSchedule.find(filter)
      .populate('targetClassIds', 'name code level')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    BellSchedule.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const pagination: PaginationMeta = {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  sendSuccess(res, 200, 'Bell schedules retrieved successfully', records, pagination);
}

export async function getBellScheduleById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid bell schedule ID');
  }

  const record = await BellSchedule.findById(id)
    .populate('targetClassIds', 'name code level')
    .exec();
  if (!record) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Bell schedule not found');
  }

  sendSuccess(res, 200, 'Bell schedule retrieved successfully', record);
}

export async function createBellSchedule(req: Request, res: Response): Promise<void> {
  const parseResult = CreateBellScheduleSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const sessionExists = await AcademicSession.findById(
    parseResult.data.academicSessionId,
  ).exec();
  if (!sessionExists) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Academic session not found');
  }

  const existingName = await BellSchedule.findOne({
    academicSessionId: parseResult.data.academicSessionId,
    name: parseResult.data.name,
  }).exec();
  if (existingName) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'Bell schedule name already exists for this session',
    );
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  if (parseResult.data.isDefault) {
    await BellSchedule.updateMany(
      { academicSessionId: parseResult.data.academicSessionId, isDefault: true },
      { $set: { isDefault: false, updatedBy: userId } },
    ).exec();
  }

  const newSchedule = await BellSchedule.create({
    ...parseResult.data,
    createdBy: userId,
    updatedBy: userId,
  });

  const populated = await BellSchedule.findById(newSchedule._id)
    .populate('targetClassIds', 'name code level')
    .exec();

  sendSuccess(res, 201, 'Bell schedule created successfully', populated);
}

export async function updateBellSchedule(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid bell schedule ID');
  }

  const parseResult = UpdateBellScheduleSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const schedule = await BellSchedule.findById(id).exec();
  if (!schedule) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Bell schedule not found');
  }

  if (parseResult.data.name && parseResult.data.name !== schedule.name) {
    const existing = await BellSchedule.findOne({
      academicSessionId: schedule.academicSessionId,
      name: parseResult.data.name,
      _id: { $ne: id },
    }).exec();
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        'Bell schedule name already exists for this session',
      );
    }
  }

  if (parseResult.data.isDefault) {
    await BellSchedule.updateMany(
      {
        academicSessionId: schedule.academicSessionId,
        isDefault: true,
        _id: { $ne: id },
      },
      { $set: { isDefault: false, updatedBy: userId } },
    ).exec();
  }

  Object.assign(schedule, parseResult.data);
  schedule.updatedBy = new mongoose.Types.ObjectId(userId);
  await schedule.save();

  const populated = await BellSchedule.findById(schedule._id)
    .populate('targetClassIds', 'name code level')
    .exec();

  sendSuccess(res, 200, 'Bell schedule updated successfully', populated);
}

export async function archiveBellSchedule(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid bell schedule ID');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const schedule = await BellSchedule.findById(id).exec();
  if (!schedule) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Bell schedule not found');
  }

  schedule.status = 'ARCHIVED';
  schedule.archivedBy = new mongoose.Types.ObjectId(userId);
  schedule.archivedAt = new Date();
  schedule.updatedBy = new mongoose.Types.ObjectId(userId);
  await schedule.save();

  sendSuccess(res, 200, 'Bell schedule archived successfully', schedule);
}

// Helper to convert time HH:MM string to minutes since midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// TimetablePeriod Handlers
export async function getTimetablePeriods(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '20'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.bellScheduleId) {
    filter.bellScheduleId = req.query.bellScheduleId;
  }
  if (req.query.isBreak !== undefined) {
    filter.isBreak = req.query.isBreak === 'true';
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const sortBy = String(req.query.sortBy || 'sequence');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    TimetablePeriod.find(filter)
      .populate('bellScheduleId', 'name scheduleType')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    TimetablePeriod.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const pagination: PaginationMeta = {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  sendSuccess(res, 200, 'Timetable periods retrieved successfully', records, pagination);
}

export async function getTimetablePeriodById(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid period ID');
  }

  const record = await TimetablePeriod.findById(id)
    .populate('bellScheduleId', 'name scheduleType')
    .exec();
  if (!record) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Period not found');
  }

  sendSuccess(res, 200, 'Timetable period retrieved successfully', record);
}

export async function createTimetablePeriod(
  req: Request,
  res: Response,
): Promise<void> {
  const parseResult = CreateTimetablePeriodSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const bellSchedule = await BellSchedule.findById(
    parseResult.data.bellScheduleId,
  ).exec();
  if (!bellSchedule) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Bell schedule not found');
  }

  const existingSequence = await TimetablePeriod.findOne({
    bellScheduleId: parseResult.data.bellScheduleId,
    sequence: parseResult.data.sequence,
    status: 'ACTIVE',
  }).exec();
  if (existingSequence) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'Period sequence already exists in this bell schedule',
    );
  }

  // Check time interval overlap
  const newStart = timeToMinutes(parseResult.data.startTime);
  const newEnd = timeToMinutes(parseResult.data.endTime);

  const existingPeriods = await TimetablePeriod.find({
    bellScheduleId: parseResult.data.bellScheduleId,
    status: 'ACTIVE',
  }).exec();

  for (const p of existingPeriods) {
    const pStart = timeToMinutes(p.startTime);
    const pEnd = timeToMinutes(p.endTime);
    if (Math.max(newStart, pStart) < Math.min(newEnd, pEnd)) {
      throw new AppError(
        409,
        ErrorCodes.BUSINESS_RULE_VIOLATION,
        `Time interval overlaps with existing period "${p.name}" (${p.startTime}-${p.endTime})`,
      );
    }
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const newPeriod = await TimetablePeriod.create({
    ...parseResult.data,
    createdBy: userId,
    updatedBy: userId,
  });

  const populated = await TimetablePeriod.findById(newPeriod._id)
    .populate('bellScheduleId', 'name scheduleType')
    .exec();

  sendSuccess(res, 201, 'Timetable period created successfully', populated);
}

export async function updateTimetablePeriod(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid period ID');
  }

  const parseResult = UpdateTimetablePeriodSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const period = await TimetablePeriod.findById(id).exec();
  if (!period) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Period not found');
  }

  if (
    parseResult.data.sequence &&
    parseResult.data.sequence !== period.sequence
  ) {
    const existing = await TimetablePeriod.findOne({
      bellScheduleId: period.bellScheduleId,
      sequence: parseResult.data.sequence,
      status: 'ACTIVE',
      _id: { $ne: id },
    }).exec();
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        'Period sequence already exists in this bell schedule',
      );
    }
  }

  const checkStartStr = parseResult.data.startTime || period.startTime;
  const checkEndStr = parseResult.data.endTime || period.endTime;
  const checkStart = timeToMinutes(checkStartStr);
  const checkEnd = timeToMinutes(checkEndStr);

  const existingPeriods = await TimetablePeriod.find({
    bellScheduleId: period.bellScheduleId,
    status: 'ACTIVE',
    _id: { $ne: id },
  }).exec();

  for (const p of existingPeriods) {
    const pStart = timeToMinutes(p.startTime);
    const pEnd = timeToMinutes(p.endTime);
    if (Math.max(checkStart, pStart) < Math.min(checkEnd, pEnd)) {
      throw new AppError(
        409,
        ErrorCodes.BUSINESS_RULE_VIOLATION,
        `Time interval overlaps with existing period "${p.name}" (${p.startTime}-${p.endTime})`,
      );
    }
  }

  Object.assign(period, parseResult.data);
  period.updatedBy = new mongoose.Types.ObjectId(userId);
  await period.save();

  const populated = await TimetablePeriod.findById(period._id)
    .populate('bellScheduleId', 'name scheduleType')
    .exec();

  sendSuccess(res, 200, 'Timetable period updated successfully', populated);
}

export async function archiveTimetablePeriod(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid period ID');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const period = await TimetablePeriod.findById(id).exec();
  if (!period) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Period not found');
  }

  period.status = 'ARCHIVED';
  period.archivedBy = new mongoose.Types.ObjectId(userId);
  period.archivedAt = new Date();
  period.updatedBy = new mongoose.Types.ObjectId(userId);
  await period.save();

  sendSuccess(res, 200, 'Timetable period archived successfully', period);
}
