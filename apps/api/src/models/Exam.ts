/**
 * Exam Model — Collection #34
 *
 * Governs school examinations scoped to an academic session and term.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { ExamType, ExamStatus } from '@laps/shared';

export interface IExam {
  name: string;
  academicSessionId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  examType: ExamType;
  status: ExamStatus;
  startDate?: Date;
  endDate?: Date;
  description?: string;
  instructions?: string;
  publishedAt?: Date;
  publishedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedAt?: Date;
  archivedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExamDocument extends IExam, Document {}

const ExamSchema = new Schema<IExamDocument>(
  {
    name: { type: String, required: true, trim: true },
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    academicTermId: { type: Schema.Types.ObjectId, ref: 'AcademicTerm', required: true },
    examType: {
      type: String,
      enum: ['UNIT_TEST', 'MID_TERM', 'FINAL', 'PRACTICAL', 'QUIZ', 'MOCK'],
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    description: { type: String, trim: true },
    instructions: { type: String, trim: true },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

ExamSchema.index({ academicSessionId: 1, academicTermId: 1, status: 1 });
ExamSchema.index({ name: 1, academicSessionId: 1 }, { unique: true });

export const Exam = model<IExamDocument>('Exam', ExamSchema);
