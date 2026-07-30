import { Request, Response } from 'express';
import {
  CreateScheduledNotificationSchema,
  ErrorCodes,
} from '@laps/shared';
import { ScheduledNotification } from '../models/ScheduledNotification';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { Notification } from '../models/Notification';
import { DeliveryLog } from '../models/DeliveryLog';
import { User } from '../models/User';
import { Enrollment } from '../models/Enrollment';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { interpolateVariables } from './template.controller';
import { shouldDispatchChannel } from './notification.controller';

export const listScheduledNotifications = async (req: Request, res: Response): Promise<void> => {
  const { status, scheduleType, page = '1', limit = '20' } = req.query;

  const query: Record<string, unknown> = {};

  if (status && status !== 'ALL') {
    query.status = status;
  }
  if (scheduleType && scheduleType !== 'ALL') {
    query.scheduleType = scheduleType;
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [jobs, total] = await Promise.all([
    ScheduledNotification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'profile.firstName profile.lastName email role'),
    ScheduledNotification.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Scheduled notifications retrieved successfully', {
    jobs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const createScheduledNotification = async (req: Request, res: Response): Promise<void> => {
  const validated = CreateScheduledNotificationSchema.parse(req.body);

  const scheduledAt = validated.scheduledAt ? new Date(validated.scheduledAt) : undefined;
  const expiryDate = validated.expiryDate ? new Date(validated.expiryDate) : undefined;

  const job = await ScheduledNotification.create({
    ...validated,
    scheduledAt,
    expiryDate,
    status: 'PENDING',
    createdBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Scheduled notification job created successfully', job);
};

export const cancelScheduledNotification = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const job = await ScheduledNotification.findById(id);

  if (!job) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Scheduled notification job not found');
  }

  if (job.status !== 'PENDING') {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      `Cannot cancel job in status "${job.status}". Only PENDING jobs can be cancelled.`
    );
  }

  job.status = 'CANCELLED';
  await job.save();

  sendSuccess(res, 200, 'Scheduled notification job cancelled successfully', job);
};

/**
 * Helper to process and dispatch a pending ScheduledNotification job.
 * Used by scheduler queues and verification tests.
 */
export async function executeScheduledJob(jobId: string): Promise<any> {
  const job = await ScheduledNotification.findById(jobId);
  if (!job) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Scheduled notification job not found');
  }

  if (job.status !== 'PENDING') {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, `Job is in status "${job.status}" and cannot be executed`);
  }

  job.status = 'PROCESSING';
  await job.save();

  // Resolve recipients
  const recipientIdsSet = new Set<string>();

  if (job.targetType === 'INDIVIDUAL' && job.recipientIds && job.recipientIds.length > 0) {
    for (const id of job.recipientIds) {
      recipientIdsSet.add(id.toString());
    }
  } else if (job.targetType === 'ROLE' && job.targetRoles && job.targetRoles.length > 0) {
    const users = await User.find({ roleCode: { $in: job.targetRoles }, status: 'ACTIVE' }, '_id');
    for (const u of users) {
      recipientIdsSet.add(u._id.toString());
    }
  } else if (
    (job.targetClassIds && job.targetClassIds.length > 0) ||
    (job.targetSectionIds && job.targetSectionIds.length > 0)
  ) {
    const query: Record<string, unknown> = { enrollmentStatus: 'ACTIVE' };
    if (job.targetClassIds && job.targetClassIds.length > 0) {
      query.classId = { $in: job.targetClassIds };
    }
    if (job.targetSectionIds && job.targetSectionIds.length > 0) {
      query.sectionId = { $in: job.targetSectionIds };
    }
    const enrollments = await Enrollment.find(query, 'studentId');
    const studentIds = enrollments.map((enr) => enr.studentId);
    const users = await User.find({ profileRef: { $in: studentIds }, status: 'ACTIVE' }, '_id');
    for (const u of users) {
      recipientIdsSet.add(u._id.toString());
    }
  } else if (job.targetType === 'ALL') {
    const users = await User.find({ status: 'ACTIVE' }, '_id');
    for (const u of users) {
      recipientIdsSet.add(u._id.toString());
    }
  }

  let titleText = job.title;
  let bodyText = job.message;
  let channels = ['IN_APP', 'EMAIL', 'SMS'] as any[];

  if (job.templateId) {
    const template = await NotificationTemplate.findById(job.templateId);
    if (template) {
      titleText = template.subjectTemplate
        ? interpolateVariables(template.subjectTemplate, job.templateVariables || {})
        : job.title;
      bodyText = interpolateVariables(template.bodyTemplate, job.templateVariables || {});
      channels = template.channels;
    }
  }

  let successCount = 0;
  let failCount = 0;

  for (const recipientId of recipientIdsSet) {
    try {
      const notification = await Notification.create({
        title: titleText,
        message: bodyText,
        priority: job.priority,
        category: job.category,
        senderId: job.createdBy,
        recipientId,
      });

      for (const channel of channels) {
        const isEnabled = await shouldDispatchChannel(recipientId, job.category, channel);
        if (isEnabled) {
          await DeliveryLog.create({
            notificationId: notification._id,
            recipientId,
            channel,
            status: 'DELIVERED',
            deliveredAt: new Date(),
          });
        }
      }

      successCount += 1;
    } catch (e) {
      failCount += 1;
    }
  }

  job.status = 'COMPLETED';
  job.totalRecipients = recipientIdsSet.size;
  job.successfulDeliveries = successCount;
  job.failedDeliveries = failCount;
  await job.save();

  return job;
}
