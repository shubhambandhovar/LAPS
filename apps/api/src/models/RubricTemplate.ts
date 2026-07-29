/**
 * RubricTemplate Model — Collection #33
 *
 * Reusable grading rubric templates that teachers can create for evaluating homework submissions.
 * Supports departmental sharing when isShared is set to true.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { RubricCriterion, EntityStatus } from '@laps/shared';

export interface IRubricTemplate {
  academicSessionId: Types.ObjectId;
  title: string;
  description?: string;
  subjectId?: Types.ObjectId;
  createdByTeacherId: Types.ObjectId;
  criteria: RubricCriterion[];
  totalMaxMarks: number;
  isShared: boolean;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRubricTemplateDocument extends IRubricTemplate, Document {}

const RubricCriterionSchema = new Schema<RubricCriterion>(
  {
    criterion: { type: String, required: true },
    maxMarks: { type: Number, required: true, min: 0 },
    description: { type: String, required: false },
  },
  { _id: false }
);

const RubricTemplateSchema = new Schema<IRubricTemplateDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      required: false,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: false,
      index: true,
    },
    createdByTeacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    criteria: {
      type: [RubricCriterionSchema],
      required: true,
      default: [],
    },
    totalMaxMarks: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    isShared: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      required: true,
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

RubricTemplateSchema.index({ createdByTeacherId: 1, status: 1 });
RubricTemplateSchema.index({ subjectId: 1, isShared: 1, status: 1 });

export const RubricTemplate = model<IRubricTemplateDocument>(
  'RubricTemplate',
  RubricTemplateSchema
);
export default RubricTemplate;
