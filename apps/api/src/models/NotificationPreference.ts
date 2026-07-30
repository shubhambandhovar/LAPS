/**
 * NotificationPreference Model — Collection #61
 *
 * User category-channel opt-in/opt-out configuration map across 7 functional categories
 * and 3 delivery channels (IN_APP, EMAIL, SMS).
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface ICategoryPreference {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface INotificationPreference {
  userId: Types.ObjectId;
  preferences: {
    attendance: ICategoryPreference;
    homework: ICategoryPreference;
    exam: ICategoryPreference;
    result: ICategoryPreference;
    fee: ICategoryPreference;
    general: ICategoryPreference;
    system: ICategoryPreference;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationPreferenceDoc extends INotificationPreference, Document {}

const categoryPreferenceSchema = new Schema<ICategoryPreference>(
  {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: true },
  },
  { _id: false }
);

const notificationPreferenceSchema = new Schema<INotificationPreferenceDoc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    preferences: {
      attendance: { type: categoryPreferenceSchema, default: () => ({ inApp: true, email: true, sms: true }) },
      homework: { type: categoryPreferenceSchema, default: () => ({ inApp: true, email: true, sms: true }) },
      exam: { type: categoryPreferenceSchema, default: () => ({ inApp: true, email: true, sms: true }) },
      result: { type: categoryPreferenceSchema, default: () => ({ inApp: true, email: true, sms: true }) },
      fee: { type: categoryPreferenceSchema, default: () => ({ inApp: true, email: true, sms: true }) },
      general: { type: categoryPreferenceSchema, default: () => ({ inApp: true, email: true, sms: true }) },
      system: { type: categoryPreferenceSchema, default: () => ({ inApp: true, email: true, sms: true }) },
    },
  },
  {
    timestamps: true,
  }
);

export const NotificationPreference = model<INotificationPreferenceDoc>('NotificationPreference', notificationPreferenceSchema);
