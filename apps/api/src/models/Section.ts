import { Schema, model, Document, Types } from 'mongoose';
import { EntityStatus } from '@laps/shared';

export interface ISection {
  academicSessionId: Types.ObjectId;
  classId: Types.ObjectId;
  name: string;
  roomNumber?: string;
  maxCapacity: number;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISectionDocument extends ISection, Document {}

const SectionSchema = new Schema<ISectionDocument>(
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
    name: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    maxCapacity: {
      type: Number,
      required: true,
      default: 40,
      min: 1,
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

SectionSchema.index(
  { academicSessionId: 1, classId: 1, name: 1 },
  { unique: true },
);
SectionSchema.index({ classId: 1, status: 1 });

export const Section = model<ISectionDocument>('Section', SectionSchema);
