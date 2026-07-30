/**
 * NotificationTemplate Model — Collection #59
 *
 * Localization-ready multi-channel message templates supporting Mustache/Handlebars
 * variable interpolation (e.g. {{studentName}}, {{dueDate}}).
 */

import { Schema, model, Document, Types } from 'mongoose';
import {
  NotificationCategory,
  DeliveryChannel,
} from '@laps/shared';

export interface INotificationTemplate {
  code: string;
  name: string;
  category: NotificationCategory;
  channels: DeliveryChannel[];
  subjectTemplate?: string;
  bodyTemplate: string;
  variables: string[];
  locale: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationTemplateDoc extends INotificationTemplate, Document {}

const notificationTemplateSchema = new Schema<INotificationTemplateDoc>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['ATTENDANCE', 'HOMEWORK', 'EXAM', 'RESULT', 'FEE', 'GENERAL', 'SYSTEM'],
      required: true,
    },
    channels: [
      {
        type: String,
        enum: ['IN_APP', 'EMAIL', 'SMS'],
      },
    ],
    subjectTemplate: {
      type: String,
      required: false,
    },
    bodyTemplate: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      default: [],
    },
    locale: {
      type: String,
      default: 'en',
    },
    isActive: {
      type: Boolean,
      default: true,
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

notificationTemplateSchema.index({ code: 1, locale: 1 }, { unique: true });
notificationTemplateSchema.index({ category: 1, isActive: 1 });

export const NotificationTemplate = model<INotificationTemplateDoc>('NotificationTemplate', notificationTemplateSchema);
