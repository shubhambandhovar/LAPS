import { Schema, model, Document, Types } from 'mongoose';
import { EntityStatus, WorkingDaysPattern, DayOfWeek } from '@laps/shared';

export interface IWorkingDayRule {
  academicSessionId: Types.ObjectId;
  workingDaysPattern: WorkingDaysPattern;
  customWorkingDays?: DayOfWeek[];
  halfDaysOfWeek?: DayOfWeek[];
  emergencyClosureActive: boolean;
  emergencyClosureReason?: string;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkingDayRuleDocument extends IWorkingDayRule, Document {}

const WorkingDayRuleSchema = new Schema<IWorkingDayRuleDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      unique: true,
      index: true,
    },
    workingDaysPattern: {
      type: String,
      enum: ['MON_TO_FRI', 'MON_TO_SAT', 'CUSTOM'],
      default: 'MON_TO_SAT',
      required: true,
    },
    customWorkingDays: [
      {
        type: String,
        enum: [
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ],
      },
    ],
    halfDaysOfWeek: [
      {
        type: String,
        enum: [
          'MONDAY',
          'TUESDAY',
          'WEDNESDAY',
          'THURSDAY',
          'FRIDAY',
          'SATURDAY',
          'SUNDAY',
        ],
      },
    ],
    emergencyClosureActive: {
      type: Boolean,
      default: false,
    },
    emergencyClosureReason: {
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

export const WorkingDayRule = model<IWorkingDayRuleDocument>('WorkingDayRule', WorkingDayRuleSchema);
