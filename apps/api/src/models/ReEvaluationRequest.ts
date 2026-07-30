/**
 * ReEvaluationRequest Model — Collection #40
 *
 * Governs student/guardian requests for marks re-checking or answer script scrutiny,
 * with admin review queue, teacher evaluator assignment, and immutable audit trail.
 */

import { Schema, model, Document, Types } from 'mongoose';
import {
  ReEvaluationType,
  ReEvaluationStatus,
  ReEvaluationAuditTrailItem,
} from '@laps/shared';

export interface IReEvaluationRequest {
  examId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  marksEntryId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classSubjectId: Types.ObjectId;
  requestType: ReEvaluationType;
  reason: string;
  previousMarks: number;
  previousGrade: string;
  revisedMarks?: number;
  revisedGrade?: string;
  marksChanged: boolean;
  status: ReEvaluationStatus;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  evaluatorTeacherId?: Types.ObjectId;
  evaluationRemarks?: string;
  completedAt?: Date;
  auditTrail: ReEvaluationAuditTrailItem[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReEvaluationRequestDocument extends IReEvaluationRequest, Document {}

const ReEvaluationAuditTrailSchema = new Schema<ReEvaluationAuditTrailItem>(
  {
    action: { type: String, required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    userId: { type: String, required: true },
    previousMarks: { type: Number },
    newMarks: { type: Number },
    comment: { type: String },
  },
  { _id: false }
);

const ReEvaluationRequestSchema = new Schema<IReEvaluationRequestDocument>(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    academicTermId: { type: Schema.Types.ObjectId, ref: 'AcademicTerm', required: true },
    marksEntryId: { type: Schema.Types.ObjectId, ref: 'MarksEntry', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    classSubjectId: { type: Schema.Types.ObjectId, ref: 'ClassSubject', required: true },
    requestType: {
      type: String,
      enum: ['RE_COUNTING', 'RE_EVALUATION', 'ANSWER_SCRIPT_VIEW'],
      required: true,
    },
    reason: { type: String, required: true },
    previousMarks: { type: Number, required: true, default: 0 },
    previousGrade: { type: String, required: true, default: '' },
    revisedMarks: { type: Number },
    revisedGrade: { type: String },
    marksChanged: { type: Boolean, default: false },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED_FOR_EVALUATION',
        'COMPLETED',
        'REJECTED',
        'ARCHIVED',
      ],
      default: 'SUBMITTED',
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    evaluatorTeacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
    evaluationRemarks: { type: String },
    completedAt: { type: Date },
    auditTrail: [ReEvaluationAuditTrailSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

ReEvaluationRequestSchema.index({ examId: 1, marksEntryId: 1, status: 1 });
ReEvaluationRequestSchema.index({ enrollmentId: 1, examId: 1 });

export const ReEvaluationRequest = model<IReEvaluationRequestDocument>(
  'ReEvaluationRequest',
  ReEvaluationRequestSchema
);
