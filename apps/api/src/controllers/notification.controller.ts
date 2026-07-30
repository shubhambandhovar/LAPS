import { Request, Response } from 'express';
import {
  SendDirectNotificationSchema,
  SendBulkNotificationSchema,
  ErrorCodes,
  DeliveryChannel,
  NotificationCategory,
} from '@laps/shared';
import { Notification } from '../models/Notification';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { NotificationPreference } from '../models/NotificationPreference';
import { DeliveryLog } from '../models/DeliveryLog';
import { Enrollment } from '../models/Enrollment';
import { User } from '../models/User';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import { interpolateVariables } from './template.controller';

/**
 * Helper to check whether user has opted into a specific delivery channel for a category.
 */
export async function shouldDispatchChannel(
  userId: string,
  category: NotificationCategory,
  channel: DeliveryChannel
): Promise<boolean> {
  let pref = await NotificationPreference.findOne({ userId });
  if (!pref) {
    pref = await NotificationPreference.create({ userId });
  }

  const categoryKey = category.toLowerCase() as keyof typeof pref.preferences;
  const catPref = pref.preferences[categoryKey] || { inApp: true, email: true, sms: true };

  if (channel === 'IN_APP') return catPref.inApp;
  if (channel === 'EMAIL') return catPref.email;
  if (channel === 'SMS') return catPref.sms;
  return true;
}

export const listMyNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const {
    readStatus,
    category,
    priority,
    isArchived = 'false',
    page = '1',
    limit = '20',
  } = req.query;

  const query: Record<string, unknown> = {
    recipientId: userId,
  };

  if (isArchived !== 'ALL') {
    query.isArchived = isArchived === 'true';
  }
  if (readStatus && readStatus !== 'ALL') {
    query.readStatus = readStatus;
  }
  if (category && category !== 'ALL') {
    query.category = category;
  }
  if (priority && priority !== 'ALL') {
    query.priority = priority;
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Notification.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Notifications retrieved successfully', {
    notifications,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  const unreadCount = await Notification.countDocuments({
    recipientId: userId,
    readStatus: 'UNREAD',
    isArchived: false,
  });

  sendSuccess(res, 200, 'Unread notification count retrieved successfully', { unreadCount });
};

export const markNotificationRead = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientId: userId },
    { $set: { readStatus: 'READ', readAt: new Date() } },
    { new: true }
  );

  if (!notification) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notification not found');
  }

  sendSuccess(res, 200, 'Notification marked as read', notification);
};

export const markAllNotificationsRead = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;

  const result = await Notification.updateMany(
    { recipientId: userId, readStatus: 'UNREAD' },
    { $set: { readStatus: 'READ', readAt: new Date() } }
  );

  sendSuccess(res, 200, 'All notifications marked as read', {
    modifiedCount: result.modifiedCount,
  });
};

export const archiveNotification = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipientId: userId },
    { $set: { isArchived: true } },
    { new: true }
  );

  if (!notification) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notification not found');
  }

  sendSuccess(res, 200, 'Notification archived successfully', notification);
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.id;

  const notification = await Notification.findOneAndDelete({ _id: id, recipientId: userId });

  if (!notification) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notification not found');
  }

  sendSuccess(res, 200, 'Notification deleted successfully', { id });
};

export const sendDirectNotification = async (req: Request, res: Response): Promise<void> => {
  const validated = SendDirectNotificationSchema.parse(req.body);

  const notificationsCreated = [];
  const deliveryLogs = [];

  for (const recipientId of validated.recipientIds) {
    const inAppOpted = await shouldDispatchChannel(recipientId, validated.category, 'IN_APP');

    if (inAppOpted || validated.channels.includes('IN_APP')) {
      const notification = await Notification.create({
        title: validated.title,
        message: validated.message,
        priority: validated.priority,
        category: validated.category,
        senderId: req.user?.id,
        recipientId,
        referenceId: validated.referenceId,
        referenceType: validated.referenceType,
      });

      notificationsCreated.push(notification);

      for (const channel of validated.channels) {
        const isEnabled = await shouldDispatchChannel(recipientId, validated.category, channel);

        if (isEnabled) {
          const log = await DeliveryLog.create({
            notificationId: notification._id,
            recipientId,
            channel,
            status: 'DELIVERED',
            deliveredAt: new Date(),
          });
          deliveryLogs.push(log);
        }
      }
    }
  }

  sendSuccess(res, 201, 'Direct notifications sent successfully', {
    totalRecipients: validated.recipientIds.length,
    notificationsCreated: notificationsCreated.length,
    deliveryLogsCreated: deliveryLogs.length,
  });
};

export const sendBulkNotification = async (req: Request, res: Response): Promise<void> => {
  const validated = SendBulkNotificationSchema.parse(req.body);

  const template = await NotificationTemplate.findOne({
    code: validated.templateCode.toUpperCase(),
    locale: validated.locale || 'en',
  });

  if (!template) {
    throw new AppError(
      404,
      ErrorCodes.RESOURCE_NOT_FOUND,
      `Template "${validated.templateCode}" (${validated.locale || 'en'}) not found`
    );
  }

  // Determine recipient user IDs
  const recipientIdsSet = new Set<string>();

  if (validated.recipientIds && validated.recipientIds.length > 0) {
    for (const id of validated.recipientIds) {
      recipientIdsSet.add(id.toString());
    }
  } else {
    if (validated.targetRoles && validated.targetRoles.length > 0) {
      const users = await User.find({ roleCode: { $in: validated.targetRoles }, status: 'ACTIVE' }, '_id');
      for (const u of users) {
        recipientIdsSet.add(u._id.toString());
      }
    }

    if (
      (validated.targetClassIds && validated.targetClassIds.length > 0) ||
      (validated.targetSectionIds && validated.targetSectionIds.length > 0)
    ) {
      const query: Record<string, unknown> = { enrollmentStatus: 'ACTIVE' };
      if (validated.targetClassIds && validated.targetClassIds.length > 0) {
        query.classId = { $in: validated.targetClassIds };
      }
      if (validated.targetSectionIds && validated.targetSectionIds.length > 0) {
        query.sectionId = { $in: validated.targetSectionIds };
      }
      const enrollments = await Enrollment.find(query, 'studentId');
      const studentIds = enrollments.map((enr) => enr.studentId);
      const users = await User.find({ profileRef: { $in: studentIds }, status: 'ACTIVE' }, '_id');
      for (const u of users) {
        recipientIdsSet.add(u._id.toString());
      }
    }
  }

  if (recipientIdsSet.size === 0) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'No target recipients matched the bulk notification criteria'
    );
  }

  const category = validated.category || template.category;
  const priority = validated.priority || 'NORMAL';
  const variables = validated.variables || {};

  const renderedSubject = template.subjectTemplate
    ? interpolateVariables(template.subjectTemplate, variables)
    : template.name;
  const renderedBody = interpolateVariables(template.bodyTemplate, variables);

  const notificationsCreated = [];
  const deliveryLogs = [];

  for (const recipientId of recipientIdsSet) {
    const notification = await Notification.create({
      title: renderedSubject,
      message: renderedBody,
      priority,
      category,
      senderId: req.user?.id,
      recipientId,
      referenceId: validated.referenceId,
      referenceType: validated.referenceType,
    });
    notificationsCreated.push(notification);

    for (const channel of template.channels) {
      const isEnabled = await shouldDispatchChannel(recipientId, category, channel);

      if (isEnabled) {
        const log = await DeliveryLog.create({
          notificationId: notification._id,
          recipientId,
          channel,
          status: 'DELIVERED',
          deliveredAt: new Date(),
        });
        deliveryLogs.push(log);
      }
    }
  }

  sendSuccess(res, 201, 'Bulk notification dispatched successfully', {
    templateUsed: template.code,
    totalRecipients: recipientIdsSet.size,
    notificationsCreated: notificationsCreated.length,
    deliveryLogsCreated: deliveryLogs.length,
  });
};
