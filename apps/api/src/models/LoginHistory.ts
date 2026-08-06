import { Schema, model, Document, Types } from 'mongoose';

export interface ILoginHistory {
  userId?: Types.ObjectId;
  schoolId: string;
  identifier: string;
  loginAt: Date;
  logoutAt?: Date;
  device?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  status: 'SUCCESS' | 'FAILURE';
  failureReason?: string;
}

export interface ILoginHistoryDocument extends ILoginHistory, Document {}

const LoginHistorySchema = new Schema<ILoginHistoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    schoolId: {
      type: String,
      required: true,
      default: 'LAPS-GOHAD',
      index: true,
    },
    identifier: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    loginAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    logoutAt: {
      type: Date,
    },
    device: {
      type: String,
    },
    browser: {
      type: String,
    },
    os: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    status: {
      type: String,
      required: true,
      enum: ['SUCCESS', 'FAILURE'],
      index: true,
    },
    failureReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

LoginHistorySchema.index({ schoolId: 1, loginAt: -1 });
LoginHistorySchema.index({ identifier: 1, loginAt: -1 });

export const LoginHistory = model<ILoginHistoryDocument>('LoginHistory', LoginHistorySchema);
