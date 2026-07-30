/**
 * ScheduledNotification Model — Collection #62
 *
 * Queue table for immediate, scheduled, and recurring broadcast notification jobs
 * with delivery telemetry (totalRecipients, successfulDeliveries, failedDeliveries).
 */

import { Schema, model, Document, Types } from 'mongoose';
import {
  NotificationPriority,
  NotificationCategory,
  ScheduledNotificationType,
  ScheduledNotificationStatus,
  ScheduledNotificationTargetType,
} from '@laps/shared';

export interface IScheduledNotification {
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  targetType: ScheduledNotificationTargetType;
  targetRoles?: string[];
  targetAcademicSessionId?: Types.ObjectId;
  targetClassIds?: Types.ObjectId[];
  targetSectionIds?: Types.ObjectId[];
  recipientIds?: Types.ObjectId[];
  templateId?: Types.ObjectId;
  templateVariables?: Record<string, any>;
  scheduleType: ScheduledNotificationType;
  scheduledAt?: Date;
  cronExpression?: string;
  expiryDate?: Date;
  status: ScheduledNotificationStatus;
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduledNotificationDoc extends IScheduledNotification, Document {}

const scheduledNotificationSchema = new Schema<IScheduledNotificationDoc>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['ATTENDANCE', 'HOMEWORK', 'EXAM', 'RESULT', 'FEE', 'GENERAL', 'SYSTEM'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    targetType: {
      type: String,
      enum: ['ALL', 'ROLE', 'CLASS', 'SECTION', 'INDIVIDUAL'],
      required: true,
    },
    targetRoles: [
      {
        type: String,
      },
    ],
    targetAcademicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: false,
    },
    targetClassIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    targetSectionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Section',
      },
    ],
    recipientIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'NotificationTemplate',
      required: false,
    },
    templateVariables: {
      type: Schema.Types.Mixed,
      required: false,
    },
    scheduleType: {
      type: String,
      enum: ['IMMEDIATE', 'SCHEDULED', 'RECURRING'],
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: false,
    },
    cronExpression: {
      type: String,
      required: false,
    },
    expiryDate: {
      type: Date,
      required: false,
    },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED'],
      default: 'PENDING',
    },
    totalRecipients: {
      type: Number,
      default: 0,
    },
    successfulDeliveries: {
      type: Number,
      default: 0,
    },
    failedDeliveries: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

scheduledNotificationSchema.index({ status: 1, scheduledAt: 1 });
scheduledNotificationSchema.index({ createdBy: 1, createdAt: -1 });

export const ScheduledNotification = model<IScheduledNotificationDoc>('ScheduledNotification', scheduledNotificationSchema);
