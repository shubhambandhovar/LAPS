/**
 * PromotionDecision Model — Collection #45
 *
 * End-of-term or end-of-year student promotion determination.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { PromotionStatus, PromotionDecisionStatus } from '@laps/shared';

export interface IPromotionDecision {
  academicSessionId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  fromClassId: Types.ObjectId;
  fromSectionId: Types.ObjectId;
  toClassId?: Types.ObjectId;
  toSectionId?: Types.ObjectId;
  promotionStatus: PromotionStatus;
  remarks?: string;
  decidedBy?: Types.ObjectId;
  decidedAt?: Date;
  status: PromotionDecisionStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedAt?: Date;
  archivedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPromotionDecisionDocument extends IPromotionDecision, Document {}

const PromotionDecisionSchema = new Schema<IPromotionDecisionDocument>(
  {
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    academicTermId: { type: Schema.Types.ObjectId, ref: 'AcademicTerm', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    fromClassId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    fromSectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    toClassId: { type: Schema.Types.ObjectId, ref: 'Class' },
    toSectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
    promotionStatus: {
      type: String,
      enum: ['PROMOTED', 'PROMOTED_CONDITIONALLY', 'DETAINED', 'COMPLETED', 'TC_ELIGIBLE'],
      required: true,
    },
    remarks: { type: String },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    archivedAt: { type: Date },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PromotionDecisionSchema.index({ academicSessionId: 1, enrollmentId: 1 }, { unique: true });
PromotionDecisionSchema.index({ fromClassId: 1, fromSectionId: 1, status: 1 });
PromotionDecisionSchema.index({ studentId: 1, status: 1 });

export const PromotionDecision = model<IPromotionDecisionDocument>(
  'PromotionDecision',
  PromotionDecisionSchema
);
