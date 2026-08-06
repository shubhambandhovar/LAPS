import { Schema, model, Document } from 'mongoose';

export interface IIdSequence {
  schoolId: string;
  sequenceType: 'STUDENT' | 'TEACHER' | 'EMPLOYEE';
  year: number; // e.g. 2026 for yearly reset, 0 for non-yearly
  prefix: string; // e.g. LAS, TCH, EMP
  currentValue: number;
}

export interface IIdSequenceDocument extends IIdSequence, Document {}

const IdSequenceSchema = new Schema<IIdSequenceDocument>(
  {
    schoolId: {
      type: String,
      required: true,
      default: 'LAPS-GOHAD',
      index: true,
    },
    sequenceType: {
      type: String,
      required: true,
      enum: ['STUDENT', 'TEACHER', 'EMPLOYEE'],
    },
    year: {
      type: Number,
      required: true,
      default: 0,
    },
    prefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    currentValue: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

IdSequenceSchema.index(
  { schoolId: 1, sequenceType: 1, year: 1, prefix: 1 },
  { unique: true },
);

export const IdSequence = model<IIdSequenceDocument>('IdSequence', IdSequenceSchema);
