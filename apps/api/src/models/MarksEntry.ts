/**
 * MarksEntry Model — Collection #37
 *
 * Governs student component marks for an Exam in a ClassSubject.
 * Strictly enforces academic dependency contract via teachingAssignmentId and enrollmentId.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { MarksEntryStatus, MarksRevisionHistoryItem } from '@laps/shared';

export interface IMarksEntry {
  examId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  classSubjectId: Types.ObjectId;
  teachingAssignmentId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  componentMarks: {
    assessmentComponentId: Types.ObjectId;
    componentName: string;
    marksObtained: number;
    isAbsent: boolean;
    isMedical: boolean;
    isExempt: boolean;
  }[];
  totalMarksObtained: number;
  maximumMarksTotal: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  isAbsent: boolean;
  isMedical: boolean;
  isExempt: boolean;
  graceMarksAwarded: number;
  remarks?: string;
  status: MarksEntryStatus;
  submittedAt?: Date;
  submittedBy?: Types.ObjectId;
  lockedAt?: Date;
  lockedBy?: Types.ObjectId;
  publishedAt?: Date;
  publishedBy?: Types.ObjectId;
  history: MarksRevisionHistoryItem[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMarksEntryDocument extends IMarksEntry, Document {}

const MarksRevisionHistorySchema = new Schema<MarksRevisionHistoryItem>(
  {
    modifiedBy: { type: String, required: true },
    modifiedAt: { type: Date, required: true, default: Date.now },
    previousTotal: { type: Number, required: true },
    newTotal: { type: Number, required: true },
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'LOCKED', 'PUBLISHED', 'ARCHIVED'],
      required: true,
    },
  },
  { _id: false }
);

const ComponentMarkItemSchema = new Schema(
  {
    assessmentComponentId: { type: Schema.Types.ObjectId, ref: 'AssessmentComponent', required: true },
    componentName: { type: String, required: true },
    marksObtained: { type: Number, required: true, default: 0 },
    isAbsent: { type: Boolean, default: false },
    isMedical: { type: Boolean, default: false },
    isExempt: { type: Boolean, default: false },
  },
  { _id: false }
);

const MarksEntrySchema = new Schema<IMarksEntryDocument>(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    academicTermId: { type: Schema.Types.ObjectId, ref: 'AcademicTerm', required: true },
    classSubjectId: { type: Schema.Types.ObjectId, ref: 'ClassSubject', required: true },
    teachingAssignmentId: { type: Schema.Types.ObjectId, ref: 'TeachingAssignment', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    componentMarks: [ComponentMarkItemSchema],
    totalMarksObtained: { type: Number, required: true, default: 0 },
    maximumMarksTotal: { type: Number, required: true, default: 100 },
    percentage: { type: Number, required: true, default: 0 },
    grade: { type: String, default: '' },
    gradePoint: { type: Number, default: 0 },
    isAbsent: { type: Boolean, default: false },
    isMedical: { type: Boolean, default: false },
    isExempt: { type: Boolean, default: false },
    graceMarksAwarded: { type: Number, default: 0 },
    remarks: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'LOCKED', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    submittedAt: { type: Date },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lockedAt: { type: Date },
    lockedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    history: [MarksRevisionHistorySchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

MarksEntrySchema.index({ examId: 1, classSubjectId: 1, status: 1 });
MarksEntrySchema.index({ examId: 1, teachingAssignmentId: 1 });
MarksEntrySchema.index({ examId: 1, enrollmentId: 1 });
MarksEntrySchema.index({ examId: 1, classSubjectId: 1, enrollmentId: 1 }, { unique: true });

export const MarksEntry = model<IMarksEntryDocument>('MarksEntry', MarksEntrySchema);
