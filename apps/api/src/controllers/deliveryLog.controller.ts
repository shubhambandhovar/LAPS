import { Request, Response } from 'express';
import { ErrorCodes } from '@laps/shared';
import { DeliveryLog } from '../models/DeliveryLog';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listDeliveryLogs = async (req: Request, res: Response): Promise<void> => {
  const {
    status,
    channel,
    recipientId,
    notificationId,
    noticeId,
    page = '1',
    limit = '20',
  } = req.query;

  const query: Record<string, unknown> = {};

  if (status && status !== 'ALL') {
    query.status = status;
  }
  if (channel && channel !== 'ALL') {
    query.channel = channel;
  }
  if (recipientId) {
    query.recipientId = recipientId;
  }
  if (notificationId) {
    query.notificationId = notificationId;
  }
  if (noticeId) {
    query.noticeId = noticeId;
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    DeliveryLog.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('recipientId', 'profile.firstName profile.lastName email role'),
    DeliveryLog.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Delivery logs retrieved successfully', {
    logs,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getDeliveryStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await DeliveryLog.aggregate([
    {
      $group: {
        _id: {
          channel: '$channel',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary: Record<string, Record<string, number>> = {
    IN_APP: { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 },
    EMAIL: { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 },
    SMS: { PENDING: 0, SENT: 0, DELIVERED: 0, FAILED: 0 },
  };

  for (const item of stats) {
    const { channel, status } = item._id;
    if (summary[channel] && summary[channel][status] !== undefined) {
      summary[channel][status] = item.count;
    }
  }

  sendSuccess(res, 200, 'Delivery log telemetry stats retrieved successfully', summary);
};

export const retryFailedDelivery = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const log = await DeliveryLog.findById(id);

  if (!log) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Delivery log entry not found');
  }

  if (log.status !== 'FAILED') {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      `Cannot retry delivery log in status "${log.status}". Only FAILED deliveries can be retried.`
    );
  }

  if (log.retryCount >= log.maxRetries) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      `Maximum retries (${log.maxRetries}) exceeded for this delivery entry`
    );
  }

  log.retryCount += 1;
  log.status = 'DELIVERED';
  log.deliveredAt = new Date();
  log.failureReason = undefined;

  await log.save();

  sendSuccess(res, 200, 'Delivery retry executed successfully', log);
};
