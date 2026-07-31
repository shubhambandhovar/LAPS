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
import { CalendarEvent } from '../models/CalendarEvent';
import { AcademicCalendarSummary } from '../models/AcademicCalendarSummary';
import { Exam } from '../models/Exam';
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';
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

  const overlapping = await Holiday.findOne({
    academicSessionId: parseResult.data.academicSessionId,
    status: 'ACTIVE',
    startDate: { $lte: parseResult.data.endDate },
    endDate: { $gte: parseResult.data.startDate },
  }).exec();
  if (overlapping) {
    throw new AppError(409, ErrorCodes.DUPLICATE_RESOURCE, 'A holiday already exists in this date range');
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

  await CalendarEvent.create({
    title: newHoliday.title,
    description: newHoliday.description,
    category: 'HOLIDAY',
    startDate: new Date(newHoliday.startDate),
    endDate: new Date(newHoliday.endDate),
    isAllDay: true,
    referenceModule: 'Holiday',
    referenceId: newHoliday._id,
    academicSessionId: newHoliday.academicSessionId,
  });

  const createdHolidays = [newHoliday];

  if (parseResult.data.isRecurring && parseResult.data.recurrenceRule) {
    const rule = parseResult.data.recurrenceRule;
    const count = rule.count || 5;
    const baseStart = new Date(newHoliday.startDate);
    const baseEnd = new Date(newHoliday.endDate);
    const diffMs = baseEnd.getTime() - baseStart.getTime();

    for (let i = 1; i < count; i++) {
      const nextStart = new Date(baseStart);
      if (rule.frequency === 'WEEKLY') {
        nextStart.setDate(nextStart.getDate() + 7 * i);
      } else if (rule.frequency === 'MONTHLY') {
        nextStart.setMonth(nextStart.getMonth() + i);
      } else if (rule.frequency === 'YEARLY') {
        nextStart.setFullYear(nextStart.getFullYear() + i);
      } else {
        nextStart.setDate(nextStart.getDate() + i);
      }

      if (rule.until && nextStart > new Date(rule.until)) {
        break;
      }

      const nextEnd = new Date(nextStart.getTime() + diffMs);
      const startStr = nextStart.toISOString().split('T')[0];
      const endStr = nextEnd.toISOString().split('T')[0];

      const overlapRec = await Holiday.findOne({
        academicSessionId: parseResult.data.academicSessionId,
        status: 'ACTIVE',
        startDate: { $lte: endStr },
        endDate: { $gte: startStr },
      }).exec();

      if (!overlapRec) {
        const recHoliday = await Holiday.create({
          ...parseResult.data,
          startDate: startStr,
          endDate: endStr,
          title: parseResult.data.title,
          createdBy: userId,
          updatedBy: userId,
        });

        createdHolidays.push(recHoliday);

        await CalendarEvent.create({
          title: recHoliday.title,
          description: recHoliday.description,
          category: 'HOLIDAY',
          startDate: new Date(recHoliday.startDate),
          endDate: new Date(recHoliday.endDate),
          isAllDay: true,
          referenceModule: 'Holiday',
          referenceId: recHoliday._id,
          academicSessionId: recHoliday.academicSessionId,
        });
      }
    }
  }

  sendSuccess(res, 201, 'Holiday created successfully', createdHolidays.length > 1 ? createdHolidays : newHoliday);
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

  await CalendarEvent.findOneAndUpdate(
    { referenceModule: 'Holiday', referenceId: holiday._id },
    {
      title: holiday.title,
      description: holiday.description,
      startDate: new Date(holiday.startDate),
      endDate: new Date(holiday.endDate),
    }
  );

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

  await CalendarEvent.deleteMany({ referenceModule: 'Holiday', referenceId: holiday._id });

  sendSuccess(res, 200, 'Holiday archived successfully', holiday);
}

// Phase 12 Unified Calendar & Analytics Handlers
export async function getUnifiedCalendar(req: Request, res: Response): Promise<void> {
  const { academicSessionId, startDate, endDate, category } = req.query;

  const filter: Record<string, unknown> = {};
  if (academicSessionId) {
    filter.academicSessionId = academicSessionId;
  }
  if (category && category !== 'ALL') {
    filter.category = category;
  }
  if (startDate && endDate) {
    const start = new Date(String(startDate));
    const end = new Date(String(endDate));
    filter.startDate = { $lte: end };
    filter.endDate = { $gte: start };
  }

  let userClassId: string | undefined;
  if (req.user?.role === 'STUDENT') {
    const orConds: any[] = [{ _id: req.user.id }, { userId: req.user.id }];
    if (req.user.profileRef) {
      orConds.push({ _id: req.user.profileRef });
    }
    const student = await Student.findOne({
      $or: orConds,
    });
    if (student) {
      const enrollment = await Enrollment.findOne({
        studentId: student._id,
      });
      if (enrollment) {
        userClassId = enrollment.classId.toString();
      }
    }
  }

  const events = await CalendarEvent.find(filter)
    .populate('targetClassIds', 'name code level')
    .sort({ startDate: 1 })
    .exec();

  const filteredEvents = events.filter((evt) => {
    if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user?.role || '')) {
      return true;
    }
    if (evt.category === 'HOLIDAY') {
      return true;
    }
    if (userClassId && evt.targetClassIds && evt.targetClassIds.length > 0) {
      const hasClass = evt.targetClassIds.some(
        (c) => c._id.toString() === userClassId || c.toString() === userClassId
      );
      if (!hasClass) return false;
    }
    return true;
  });

  sendSuccess(res, 200, 'Unified calendar retrieved successfully', filteredEvents, {
    page: 1,
    limit: filteredEvents.length || 1,
    totalRecords: filteredEvents.length,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
}

export async function getCalendarSummary(req: Request, res: Response): Promise<void> {
  const { academicSessionId, termId } = req.query;

  if (!academicSessionId || !mongoose.Types.ObjectId.isValid(String(academicSessionId))) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Valid academicSessionId is required');
  }

  const holidayCount = await Holiday.countDocuments({
    academicSessionId,
    status: 'ACTIVE',
  });

  const examCount = await Exam.countDocuments({
    academicSessionId,
    status: { $ne: 'CANCELLED' },
  });

  const totalDays = 180;
  const workingDays = Math.max(0, totalDays - holidayCount);
  const examinationDays = examCount * 5;
  const teachingDays = Math.max(0, workingDays - examinationDays);

  const summary = await AcademicCalendarSummary.findOneAndUpdate(
    {
      academicSessionId,
      ...(termId ? { termId } : {}),
    },
    {
      totalDays,
      workingDays,
      holidayCount,
      teachingDays,
      examinationDays,
      updatedAt: new Date(),
    },
    { new: true, upsert: true }
  );

  sendSuccess(res, 200, 'Academic calendar summary retrieved successfully', summary);
}
