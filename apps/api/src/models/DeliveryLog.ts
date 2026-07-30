/**
 * DeliveryLog Model — Collection #60
 *
 * Channel delivery ledger tracking dispatch status across IN_APP, EMAIL, and SMS,
 * including retry mechanics and failure reason recording.
 */

import { Schema, model, Document, Types } from 'mongoose';
import {
  DeliveryChannel,
  DeliveryStatus,
} from '@laps/shared';

export interface IDeliveryLog {
  notificationId?: Types.ObjectId;
  noticeId?: Types.ObjectId;
  recipientId: Types.ObjectId;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  retryCount: number;
  maxRetries: number;
  failureReason?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeliveryLogDoc extends IDeliveryLog, Document {}

const deliveryLogSchema = new Schema<IDeliveryLogDoc>(
  {
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: false,
    },
    noticeId: {
      type: Schema.Types.ObjectId,
      ref: 'Notice',
      required: false,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ['IN_APP', 'EMAIL', 'SMS'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED'],
      default: 'PENDING',
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    failureReason: {
      type: String,
      required: false,
    },
    sentAt: {
      type: Date,
      required: false,
    },
    deliveredAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

deliveryLogSchema.index({ status: 1, channel: 1, createdAt: -1 });
deliveryLogSchema.index({ recipientId: 1, createdAt: -1 });
deliveryLogSchema.index({ notificationId: 1 });

export const DeliveryLog = model<IDeliveryLogDoc>('DeliveryLog', deliveryLogSchema);
