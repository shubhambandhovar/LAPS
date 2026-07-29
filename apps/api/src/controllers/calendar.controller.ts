import { Request, Response } from 'express';
import {
  CreateCalendarEventSchema,
  UpdateCalendarEventSchema,
  UpsertWorkingDayRuleSchema,
  CreateHolidaySchema,
  UpdateHolidaySchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { AcademicCalendarEvent } from '../models/AcademicCalendarEvent';
import { WorkingDayRule } from '../models/WorkingDayRule';
import { Holiday } from '../models/Holiday';
import { AcademicSession } from '../models/AcademicSession';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

// AcademicCalendarEvent Handlers
export async function getCalendarEvents(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '50'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.eventType) {
    filter.eventType = req.query.eventType;
  }
  if (req.query.isWorkingDay !== undefined) {
    filter.isWorkingDay = req.query.isWorkingDay === 'true';
  }
  if (req.query.targetClassId) {
    filter.$or = [
      { appliesToAllClasses: true },
      { targetClassIds: req.query.targetClassId },
    ];
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.startDate && req.query.endDate) {
    filter.startDate = { $lte: req.query.endDate };
    filter.endDate = { $gte: req.query.startDate };
  } else if (req.query.startDate) {
    filter.endDate = { $gte: req.query.startDate };
  } else if (req.query.endDate) {
    filter.startDate = { $lte: req.query.endDate };
  }
  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search), 'i');
    filter.title = searchRegex;
  }

  const sortBy = String(req.query.sortBy || 'startDate');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    AcademicCalendarEvent.find(filter)
      .populate('targetClassIds', 'name code level')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    AcademicCalendarEvent.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Calendar events retrieved successfully', records, pagination);
}

export async function getCalendarEventById(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid calendar event ID');
  }

  const event = await AcademicCalendarEvent.findById(id)
    .populate('targetClassIds', 'name code level')
    .exec();
  if (!event) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Calendar event not found');
  }

  sendSuccess(res, 200, 'Calendar event retrieved successfully', event);
}

export async function createCalendarEvent(
  req: Request,
  res: Response,
): Promise<void> {
  const parseResult = CreateCalendarEventSchema.safeParse(req.body);
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

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const newEvent = await AcademicCalendarEvent.create({
    ...parseResult.data,
    createdBy: userId,
    updatedBy: userId,
  });

  const populated = await AcademicCalendarEvent.findById(newEvent._id)
    .populate('targetClassIds', 'name code level')
    .exec();

  sendSuccess(res, 201, 'Calendar event created successfully', populated);
}

export async function updateCalendarEvent(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid calendar event ID');
  }

  const parseResult = UpdateCalendarEventSchema.safeParse(req.body);
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

  const event = await AcademicCalendarEvent.findById(id).exec();
  if (!event) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Calendar event not found');
  }

  Object.assign(event, parseResult.data);
  event.updatedBy = new mongoose.Types.ObjectId(userId);
  await event.save();

  const populated = await AcademicCalendarEvent.findById(event._id)
    .populate('targetClassIds', 'name code level')
    .exec();

  sendSuccess(res, 200, 'Calendar event updated successfully', populated);
}

export async function archiveCalendarEvent(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid calendar event ID');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const event = await AcademicCalendarEvent.findById(id).exec();
  if (!event) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Calendar event not found');
  }

  event.status = 'ARCHIVED';
  event.archivedBy = new mongoose.Types.ObjectId(userId);
  event.archivedAt = new Date();
  event.updatedBy = new mongoose.Types.ObjectId(userId);
  await event.save();

  sendSuccess(res, 200, 'Calendar event archived successfully', event);
}

// WorkingDayRule Handlers
export async function getWorkingDayRules(
  req: Request,
  res: Response,
): Promise<void> {
  const filter: Record<string, unknown> = {};
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const records = await WorkingDayRule.find(filter).exec();
  sendSuccess(res, 200, 'Working day rules retrieved successfully', records);
}

export async function upsertWorkingDayRule(
  req: Request,
  res: Response,
): Promise<void> {
  const parseResult = UpsertWorkingDayRuleSchema.safeParse(req.body);
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

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  let rule = await WorkingDayRule.findOne({
    academicSessionId: parseResult.data.academicSessionId,
  }).exec();

  if (rule) {
    Object.assign(rule, parseResult.data);
    rule.updatedBy = new mongoose.Types.ObjectId(userId);
    await rule.save();
    sendSuccess(res, 200, 'Working day rule updated successfully', rule);
  } else {
    rule = await WorkingDayRule.create({
      ...parseResult.data,
      createdBy: userId,
      updatedBy: userId,
    });
    sendSuccess(res, 201, 'Working day rule created successfully', rule);
  }
}

export async function archiveWorkingDayRule(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid working day rule ID');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const rule = await WorkingDayRule.findById(id).exec();
  if (!rule) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Working day rule not found');
  }

  rule.status = 'ARCHIVED';
  rule.archivedBy = new mongoose.Types.ObjectId(userId);
  rule.archivedAt = new Date();
  rule.updatedBy = new mongoose.Types.ObjectId(userId);
  await rule.save();

  sendSuccess(res, 200, 'Working day rule archived successfully', rule);
}

// Holiday Handlers
export async function getHolidays(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '50'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.holidayType) {
    filter.holidayType = req.query.holidayType;
  }
  if (req.query.isOptionalHoliday !== undefined) {
    filter.isOptionalHoliday = req.query.isOptionalHoliday === 'true';
  }
  if (req.query.affectsAttendance !== undefined) {
    filter.affectsAttendance = req.query.affectsAttendance === 'true';
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.startDate && req.query.endDate) {
    filter.startDate = { $lte: req.query.endDate };
    filter.endDate = { $gte: req.query.startDate };
  } else if (req.query.startDate) {
    filter.endDate = { $gte: req.query.startDate };
  } else if (req.query.endDate) {
    filter.startDate = { $lte: req.query.endDate };
  }
  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search), 'i');
    filter.title = searchRegex;
  }

  const sortBy = String(req.query.sortBy || 'startDate');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    Holiday.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Holiday.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Holidays retrieved successfully', records, pagination);
}

export async function getHolidayById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid holiday ID');
  }

  const holiday = await Holiday.findById(id).exec();
  if (!holiday) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Holiday not found');
  }

  sendSuccess(res, 200, 'Holiday retrieved successfully', holiday);
}

export async function createHoliday(req: Request, res: Response): Promise<void> {
  const parseResult = CreateHolidaySchema.safeParse(req.body);
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

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const newHoliday = await Holiday.create({
    ...parseResult.data,
    createdBy: userId,
    updatedBy: userId,
  });

  sendSuccess(res, 201, 'Holiday created successfully', newHoliday);
}

export async function updateHoliday(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid holiday ID');
  }

  const parseResult = UpdateHolidaySchema.safeParse(req.body);
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

  const holiday = await Holiday.findById(id).exec();
  if (!holiday) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Holiday not found');
  }

  Object.assign(holiday, parseResult.data);
  holiday.updatedBy = new mongoose.Types.ObjectId(userId);
  await holiday.save();

  sendSuccess(res, 200, 'Holiday updated successfully', holiday);
}

export async function archiveHoliday(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid holiday ID');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const holiday = await Holiday.findById(id).exec();
  if (!holiday) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Holiday not found');
  }

  holiday.status = 'ARCHIVED';
  holiday.archivedBy = new mongoose.Types.ObjectId(userId);
  holiday.archivedAt = new Date();
  holiday.updatedBy = new mongoose.Types.ObjectId(userId);
  await holiday.save();

  sendSuccess(res, 200, 'Holiday archived successfully', holiday);
}
