import { Schema, model, Document, Types } from 'mongoose';
import { AcademicSessionStatus } from '@laps/shared';

export interface IAcademicSession {
  name: string;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  status: AcademicSessionStatus;
  isPromotionLocked: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAcademicSessionDocument extends IAcademicSession, Document {}

const AcademicSessionSchema = new Schema<IAcademicSessionDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isCurrent: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'ACTIVE', 'ARCHIVED'],
      default: 'PLANNED',
      index: true,
    },
    isPromotionLocked: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    archivedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
  },
);

export const AcademicSession = model<IAcademicSessionDocument>(
  'AcademicSession',
  AcademicSessionSchema,
);
