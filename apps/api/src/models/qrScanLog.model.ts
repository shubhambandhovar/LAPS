import mongoose, { Schema, Document } from 'mongoose';
import { QrScanResult, QrScanLog } from '@laps/shared';

export interface QrScanLogDocument extends Omit<QrScanLog, 'id'>, Document {
  id: string;
}

const qrScanLogSchema = new Schema(
  {
    qrCodeId: {
      type: String,
      required: true,
      index: true,
    },
    scannedBy: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
    },
    result: {
      type: String,
      enum: Object.values(QrScanResult),
      required: true,
    },
    deviceInfo: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

export const QrScanLogModel = mongoose.model<QrScanLogDocument>('QrScanLog', qrScanLogSchema);
