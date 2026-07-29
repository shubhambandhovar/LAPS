/**
 * HomeworkSubmission Model — Collection #31
 *
 * Records student submissions for homework assignments with multi-attempt support,
 * automatic late arrival tracking (isLate, lateMinutes), reserved plagiarismStatus,
 * and embedded teacher evaluation with rubric scoring.
 */

import { Schema, model, Document, Types } from 'mongoose';
import {
  HomeworkSubmissionStatus,
  PlagiarismStatus,
  HomeworkAttachment,
} from '@laps/shared';

export interface IHomeworkEvaluationRubricItem {
  criterion: string;
  marksAwarded: number;
  maxMarks: number;
  comment?: string;
}

export interface IHomeworkEvaluation {
  rubricTemplateId?: Types.ObjectId;
  marks?: number;
  grade?: string;
  remarks?: string;
  rubric?: IHomeworkEvaluationRubricItem[];
  evaluatedBy?: Types.ObjectId;
  evaluatedAt?: Date;
  returnedForResubmission: boolean;
}

export interface IHomeworkSubmission {
  homeworkId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  currentAttempt: number;
  plagiarismStatus: PlagiarismStatus;
  attachments: HomeworkAttachment[];
  remarks?: string;
  submittedAt: Date;
  isLate: boolean;
  lateMinutes: number;
  status: HomeworkSubmissionStatus;
  evaluation?: IHomeworkEvaluation;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHomeworkSubmissionDocument extends IHomeworkSubmission, Document {}

const HomeworkAttachmentSchema = new Schema<HomeworkAttachment>(
  {
    type: {
      type: String,
      enum: ['PDF', 'IMAGE', 'VIDEO', 'LINK', 'ZIP', 'DOCUMENT'],
      required: true,
    },
    url: { type: String, required: true },
    title: { type: String, required: false },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true, default: 0 },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, required: false },
  },
  { _id: false }
);

const HomeworkEvaluationRubricItemSchema = new Schema<IHomeworkEvaluationRubricItem>(
  {
    criterion: { type: String, required: true },
    marksAwarded: { type: Number, required: true, default: 0, min: 0 },
    maxMarks: { type: Number, required: true, min: 0 },
    comment: { type: String, required: false },
  },
  { _id: false }
);

const HomeworkEvaluationSchema = new Schema<IHomeworkEvaluation>(
  {
    rubricTemplateId: {
      type: Schema.Types.ObjectId,
      ref: 'RubricTemplate',
      required: false,
    },
    marks: { type: Number, required: false, min: 0 },
    grade: { type: String, required: false },
    remarks: { type: String, required: false },
    rubric: { type: [HomeworkEvaluationRubricItemSchema], default: [] },
    evaluatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    evaluatedAt: { type: Date, required: false },
    returnedForResubmission: { type: Boolean, default: false },
  },
  { _id: false }
);

const HomeworkSubmissionSchema = new Schema<IHomeworkSubmissionDocument>(
  {
    homeworkId: {
      type: Schema.Types.ObjectId,
      ref: 'Homework',
      required: true,
      index: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    currentAttempt: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    plagiarismStatus: {
      type: String,
      enum: ['NOT_CHECKED', 'CHECKED'],
      default: 'NOT_CHECKED',
      required: true,
    },
    attachments: {
      type: [HomeworkAttachmentSchema],
      default: [],
    },
    remarks: {
      type: String,
      required: false,
    },
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    isLate: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
    lateMinutes: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'EVALUATED', 'RETURNED', 'ARCHIVED'],
      default: 'SUBMITTED',
      required: true,
      index: true,
    },
    evaluation: {
      type: HomeworkEvaluationSchema,
      required: false,
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
      required: false,
    },
    archivedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index across attempts to prevent duplicate concurrent attempt numbers
HomeworkSubmissionSchema.index(
  { homeworkId: 1, enrollmentId: 1, currentAttempt: 1 },
  { unique: true }
);
HomeworkSubmissionSchema.index({ studentId: 1, status: 1, submittedAt: -1 });
HomeworkSubmissionSchema.index({ homeworkId: 1, status: 1, isLate: 1 });

export const HomeworkSubmission = model<IHomeworkSubmissionDocument>(
  'HomeworkSubmission',
  HomeworkSubmissionSchema
);
export default HomeworkSubmission;
