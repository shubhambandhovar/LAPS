import { Schema, model, Document, Types } from 'mongoose';
import { EntityStatus } from '@laps/shared';

export interface IClassSubject {
  academicSessionId: Types.ObjectId;
  classId: Types.ObjectId;
  subjectId: Types.ObjectId;
  isMandatory: boolean;
  isOptional: boolean;
  subjectGroup?: string;
  minPeriodsPerWeek?: number;
  maxPeriodsPerWeek?: number;
  orderSequence: number;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IClassSubjectDocument extends IClassSubject, Document {}

const ClassSubjectSchema = new Schema<IClassSubjectDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    isMandatory: {
      type: Boolean,
      default: true,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
    subjectGroup: {
      type: String,
      trim: true,
    },
    minPeriodsPerWeek: {
      type: Number,
      min: 0,
    },
    maxPeriodsPerWeek: {
      type: Number,
      min: 0,
    },
    orderSequence: {
      type: Number,
      default: 1,
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

ClassSubjectSchema.index({ academicSessionId: 1, classId: 1, subjectId: 1 }, { unique: true });
ClassSubjectSchema.index({ classId: 1, orderSequence: 1 });

export const ClassSubject = model<IClassSubjectDocument>('ClassSubject', ClassSubjectSchema);
