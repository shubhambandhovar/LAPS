import { Schema, model, Document, Types } from 'mongoose';
import { EntityStatus, HolidayType } from '@laps/shared';

export interface IHoliday {
  academicSessionId: Types.ObjectId;
  title: string;
  holidayType: HolidayType;
  startDate: string;
  endDate: string;
  isOptionalHoliday: boolean;
  affectsAttendance: boolean;
  description?: string;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHolidayDocument extends IHoliday, Document {}

const HolidaySchema = new Schema<IHolidayDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    holidayType: {
      type: String,
      enum: ['NATIONAL', 'STATE', 'SCHOOL', 'OPTIONAL', 'EMERGENCY_CLOSURE'],
      required: true,
      index: true,
    },
    startDate: {
      type: String,
      required: true,
      index: true,
    },
    endDate: {
      type: String,
      required: true,
      index: true,
    },
    isOptionalHoliday: {
      type: Boolean,
      default: false,
    },
    affectsAttendance: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
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

HolidaySchema.index({ academicSessionId: 1, startDate: 1, endDate: 1 });
HolidaySchema.index({ holidayType: 1, status: 1 });

export const Holiday = model<IHolidayDocument>('Holiday', HolidaySchema);
