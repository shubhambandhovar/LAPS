import { Schema, model, Document, Types } from 'mongoose';
import { EntityStatus, BellScheduleType, BellScheduleScopeType } from '@laps/shared';

export interface IBellSchedule {
  academicSessionId: Types.ObjectId;
  name: string;
  scheduleType: BellScheduleType;
  scopeType: BellScheduleScopeType;
  targetClassIds?: Types.ObjectId[];
  validFrom?: string;
  validTo?: string;
  isDefault: boolean;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBellScheduleDocument extends IBellSchedule, Document {}

const BellScheduleSchema = new Schema<IBellScheduleDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    scheduleType: {
      type: String,
      enum: ['REGULAR', 'EXAM', 'HALF_DAY', 'SPECIAL_EVENT'],
      default: 'REGULAR',
      index: true,
    },
    scopeType: {
      type: String,
      enum: ['GLOBAL', 'CLASS'],
      default: 'GLOBAL',
      index: true,
    },
    targetClassIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    validFrom: {
      type: String,
    },
    validTo: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
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

BellScheduleSchema.index({ academicSessionId: 1, name: 1 }, { unique: true });
BellScheduleSchema.index({ academicSessionId: 1, isDefault: 1 });
BellScheduleSchema.index({ academicSessionId: 1, scopeType: 1, validFrom: 1, validTo: 1 });

export const BellSchedule = model<IBellScheduleDocument>('BellSchedule', BellScheduleSchema);
