import { Request, Response } from 'express';
import {
  CreateSchoolEventSchema,
  UpdateSchoolEventSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { SchoolEvent } from '../models/SchoolEvent';
import { CalendarEvent } from '../models/CalendarEvent';
import { AcademicSession } from '../models/AcademicSession';
import { Student } from '../models/Student';
import { Enrollment } from '../models/Enrollment';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getEvents(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.eventType) {
    filter.eventType = req.query.eventType;
  }
  if (req.query.visibility) {
    filter.visibility = req.query.visibility;
  }

  let userClassId: string | undefined;
  if (req.user?.role === 'STUDENT') {
    const student = await Student.findOne({
      $or: [{ userId: req.user.id }, { _id: req.user.id }],
    });
    if (student) {
      const enrollment = await Enrollment.findOne({
        studentId: student._id,
        status: 'ACTIVE',
      });
      if (enrollment) {
        userClassId = enrollment.classId.toString();
      }
    }
  }

  const [events, totalRecords] = await Promise.all([
    SchoolEvent.find(filter)
      .populate('targetClassIds', 'name code level')
      .populate('targetSectionIds', 'name')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    SchoolEvent.countDocuments(filter).exec(),
  ]);

  const filteredEvents = events.filter((evt) => {
    if (['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user?.role || '')) {
      return true;
    }
    if (evt.visibility === 'SCHOOL_WIDE') {
      return true;
    }
    if (userClassId && evt.targetClassIds && evt.targetClassIds.length > 0) {
      const hasClass = evt.targetClassIds.some(
        (c) => c._id.toString() === userClassId || c.toString() === userClassId
      );
      return hasClass;
    }
    return false;
  });

  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const pagination: PaginationMeta = {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  sendSuccess(res, 200, 'School events retrieved successfully', filteredEvents, pagination);
}

export async function getEventById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid event ID');
  }

  const event = await SchoolEvent.findById(id)
    .populate('targetClassIds', 'name code level')
    .populate('targetSectionIds', 'name')
    .exec();

  if (!event || event.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'School event not found');
  }

  sendSuccess(res, 200, 'School event retrieved successfully', event);
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  const parseResult = CreateSchoolEventSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message
    );
  }

  const sessionExists = await AcademicSession.findById(
    parseResult.data.academicSessionId
  ).exec();
  if (!sessionExists) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Academic session not found');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const newEvent = await SchoolEvent.create({
    ...parseResult.data,
    createdBy: userId,
  });

  await CalendarEvent.create({
    title: newEvent.name,
    description: newEvent.description,
    category: 'EVENT',
    startDate: new Date(newEvent.startDate),
    endDate: new Date(newEvent.endDate),
    isAllDay: newEvent.isAllDay,
    referenceModule: 'SchoolEvent',
    referenceId: newEvent._id,
    targetClassIds: newEvent.targetClassIds,
    targetSectionIds: newEvent.targetSectionIds,
    academicSessionId: newEvent.academicSessionId,
  });

  sendSuccess(res, 201, 'School event created successfully', newEvent);
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid event ID');
  }

  const parseResult = UpdateSchoolEventSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message
    );
  }

  const event = await SchoolEvent.findById(id).exec();
  if (!event || event.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'School event not found');
  }

  Object.assign(event, parseResult.data);
  await event.save();

  await CalendarEvent.findOneAndUpdate(
    { referenceModule: 'SchoolEvent', referenceId: event._id },
    {
      title: event.name,
      description: event.description,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      isAllDay: event.isAllDay,
      targetClassIds: event.targetClassIds,
      targetSectionIds: event.targetSectionIds,
    }
  );

  sendSuccess(res, 200, 'School event updated successfully', event);
}

export async function archiveEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid event ID');
  }

  const event = await SchoolEvent.findById(id).exec();
  if (!event || event.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'School event not found');
  }

  event.status = 'ARCHIVED';
  await event.save();

  await CalendarEvent.deleteMany({ referenceModule: 'SchoolEvent', referenceId: event._id });

  sendSuccess(res, 200, 'School event archived successfully', event);
}
