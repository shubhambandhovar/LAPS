import { Request, Response } from 'express';
import {
  CreateEventReminderSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { EventReminder } from '../models/EventReminder';
import { CalendarEvent } from '../models/CalendarEvent';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getReminders(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const skip = (page - 1) * limit;

  const [reminders, totalRecords] = await Promise.all([
    EventReminder.find({ userId })
      .populate('calendarEventId', 'title startDate endDate category priority')
      .sort({ reminderTime: 1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    EventReminder.countDocuments({ userId }).exec(),
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

  sendSuccess(res, 200, 'Reminders retrieved successfully', reminders, pagination);
}

export async function createReminder(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const parseResult = CreateEventReminderSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message
    );
  }

  const calendarEvent = await CalendarEvent.findById(parseResult.data.calendarEventId).exec();
  if (!calendarEvent) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Calendar event not found');
  }

  const reminder = await EventReminder.create({
    ...parseResult.data,
    userId,
    status: 'PENDING',
  });

  sendSuccess(res, 201, 'Reminder created successfully', reminder);
}

export async function cancelReminder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid reminder ID');
  }

  const reminder = await EventReminder.findByIdAndDelete(id).exec();
  if (!reminder) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Reminder not found');
  }

  sendSuccess(res, 200, 'Reminder cancelled successfully', reminder);
}
