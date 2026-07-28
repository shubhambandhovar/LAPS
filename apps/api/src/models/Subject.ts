import { Schema, model, Document, Types } from 'mongoose';
import { SubjectType, EntityStatus } from '@laps/shared';

export interface ISubject {
  name: string;
  code: string;
  shortName: string;
  subjectType: SubjectType;
  isOptional: boolean;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubjectDocument extends ISubject, Document {}

const SubjectSchema = new Schema<ISubjectDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    shortName: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    subjectType: {
      type: String,
      enum: ['THEORY', 'PRACTICAL', 'CO_CURRICULAR'],
      default: 'THEORY',
      index: true,
    },
    isOptional: {
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

export function generateSubjectCode(shortName: string): string {
  const clean = shortName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `SUB-${clean.slice(0, 6)}`;
}

SubjectSchema.pre('validate', function (next) {
  if (!this.code && this.shortName) {
    this.code = generateSubjectCode(this.shortName);
  }
  next();
});

export const Subject = model<ISubjectDocument>('Subject', SubjectSchema);
