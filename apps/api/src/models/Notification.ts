/**
 * Notification Model — Collection #57
 *
 * Real-time user alert feed supporting priority levels, readStatus, archiving,
 * and polymorphic reference pointers to ERP entities without duplicating data.
 */

import { Schema, model, Document, Types } from 'mongoose';
import {
  NotificationPriority,
  NotificationCategory,
  NotificationReadStatus,
} from '@laps/shared';

export interface INotification {
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  senderId?: Types.ObjectId;
  recipientId: Types.ObjectId;
  readStatus: NotificationReadStatus;
  readAt?: Date;
  isArchived: boolean;
  referenceId?: Types.ObjectId;
  referenceType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationDoc extends INotification, Document {}

const notificationSchema = new Schema<INotificationDoc>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    category: {
      type: String,
      enum: ['ATTENDANCE', 'HOMEWORK', 'EXAM', 'RESULT', 'FEE', 'GENERAL', 'SYSTEM'],
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    readStatus: {
      type: String,
      enum: ['READ', 'UNREAD'],
      default: 'UNREAD',
    },
    readAt: {
      type: Date,
      required: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    referenceType: {
      type: String,
      enum: ['Invoice', 'Homework', 'Exam', 'Notice', 'Attendance', 'ReportCard'],
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, readStatus: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isArchived: 1, createdAt: -1 });
notificationSchema.index({ category: 1, createdAt: -1 });

export const Notification = model<INotificationDoc>('Notification', notificationSchema);
