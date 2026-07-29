import { Schema, model, Document, Types } from 'mongoose';
import { EntityStatus, AcademicEventType, RecurrenceRule } from '@laps/shared';

export interface IAcademicCalendarEvent {
  academicSessionId: Types.ObjectId;
  title: string;
  eventType: AcademicEventType;
  startDate: string;
  endDate: string;
  isWorkingDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  appliesToAllClasses: boolean;
  targetClassIds?: Types.ObjectId[];
  description?: string;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAcademicCalendarEventDocument extends IAcademicCalendarEvent, Document {}

const RecurrenceRuleSchema = new Schema(
  {
    frequency: {
      type: String,
      enum: ['WEEKLY', 'MONTHLY', 'YEARLY'],
      required: true,
    },
    interval: {
      type: Number,
      default: 1,
    },
    count: {
      type: Number,
    },
    untilDate: {
      type: String,
    },
  },
  { _id: false }
);

const AcademicCalendarEventSchema = new Schema<IAcademicCalendarEventDocument>(
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
    eventType: {
      type: String,
      enum: [
        'WORKING_DAY',
        'HOLIDAY',
        'HALF_DAY',
        'EXAM_BLOCK',
        'VACATION',
        'SPECIAL_EVENT',
        'EMERGENCY_CLOSURE',
      ],
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
    isWorkingDay: {
      type: Boolean,
      default: false,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrenceRule: {
      type: RecurrenceRuleSchema,
    },
    appliesToAllClasses: {
      type: Boolean,
      default: true,
    },
    targetClassIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
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

AcademicCalendarEventSchema.index({ academicSessionId: 1, startDate: 1, endDate: 1 });
AcademicCalendarEventSchema.index({ eventType: 1, status: 1 });

export const AcademicCalendarEvent = model<IAcademicCalendarEventDocument>(
  'AcademicCalendarEvent',
  AcademicCalendarEventSchema
);
