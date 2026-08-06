import mongoose, { Schema, Document } from 'mongoose';
import { QrType, QrStatus, QrCode } from '@laps/shared';

export interface QrCodeDocument extends Omit<QrCode, 'id'>, Document {
  id: string;
}

const qrCodeSchema = new Schema(
  {
    qrType: {
      type: String,
      enum: Object.values(QrType),
      required: true,
    },
    referenceId: {
      type: String, // String can store ObjectIds or external references
      required: true,
      index: true,
    },
    secureToken: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(QrStatus),
      default: QrStatus.ACTIVE,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

export const QrCodeModel = mongoose.model<QrCodeDocument>('QrCode', qrCodeSchema);
