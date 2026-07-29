import { Schema, model, Document, Types } from 'mongoose';
import { EntityStatus } from '@laps/shared';

export interface ITimetablePeriod {
  academicSessionId: Types.ObjectId;
  bellScheduleId: Types.ObjectId;
  name: string;
  sequence: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITimetablePeriodDocument extends ITimetablePeriod, Document {}

const TimetablePeriodSchema = new Schema<ITimetablePeriodDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    bellScheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'BellSchedule',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    isBreak: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
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

TimetablePeriodSchema.index({ bellScheduleId: 1, sequence: 1 }, { unique: true });
TimetablePeriodSchema.index({ bellScheduleId: 1, startTime: 1, endTime: 1 });

export const TimetablePeriod = model<ITimetablePeriodDocument>('TimetablePeriod', TimetablePeriodSchema);
