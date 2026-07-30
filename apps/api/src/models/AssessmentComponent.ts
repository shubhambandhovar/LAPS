/**
 * AssessmentComponent Model — Collection #36
 *
 * Governs assessment breakdown components (THEORY, PRACTICAL, PROJECT, ORAL, INTERNAL, OTHER)
 * for an exam subject, ensuring total weightage does not exceed 100%.
 */

import { Schema, model, Document, Types, Model } from 'mongoose';
import { AssessmentComponentName, AssessmentComponentStatus } from '@laps/shared';

export interface IAssessmentComponent {
  examId: Types.ObjectId;
  classSubjectId: Types.ObjectId;
  componentName: AssessmentComponentName;
  weightage: number; // 0 - 100
  maximumMarks: number;
  passingMarks: number;
  isMandatoryToPass: boolean;
  orderSequence: number;
  status: AssessmentComponentStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssessmentComponentDocument extends IAssessmentComponent, Document {}

export interface IAssessmentComponentModel extends Model<IAssessmentComponentDocument> {
  validateTotalWeightage(
    examId: string | Types.ObjectId,
    classSubjectId: string | Types.ObjectId,
    newWeightage: number,
    excludeComponentId?: string | Types.ObjectId
  ): Promise<{ isValid: boolean; currentTotal: number; message?: string }>;
}

const AssessmentComponentSchema = new Schema<
  IAssessmentComponentDocument,
  IAssessmentComponentModel
>(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    classSubjectId: { type: Schema.Types.ObjectId, ref: 'ClassSubject', required: true },
    componentName: {
      type: String,
      enum: ['THEORY', 'PRACTICAL', 'PROJECT', 'ORAL', 'INTERNAL', 'OTHER'],
      required: true,
    },
    weightage: { type: Number, required: true, min: 0, max: 100 },
    maximumMarks: { type: Number, required: true },
    passingMarks: { type: Number, required: true },
    isMandatoryToPass: { type: Boolean, default: true },
    orderSequence: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

AssessmentComponentSchema.index({ examId: 1, classSubjectId: 1, status: 1 });
AssessmentComponentSchema.index({ examId: 1, classSubjectId: 1, componentName: 1 }, { unique: true });

AssessmentComponentSchema.statics.validateTotalWeightage = async function (
  examId,
  classSubjectId,
  newWeightage,
  excludeComponentId
) {
  const query: Record<string, any> = {
    examId,
    classSubjectId,
    status: 'ACTIVE',
  };
  if (excludeComponentId) {
    query._id = { $ne: excludeComponentId };
  }
  const components = await this.find(query);
  const existingSum = components.reduce((sum, comp) => sum + (comp.weightage || 0), 0);
  const total = existingSum + newWeightage;

  if (total > 100) {
    return {
      isValid: false,
      currentTotal: total,
      message: `Total weightage cannot exceed 100%. Current sum: ${existingSum}%, requested: ${newWeightage}%.`,
    };
  }

  return { isValid: true, currentTotal: total };
};

export const AssessmentComponent = model<
  IAssessmentComponentDocument,
  IAssessmentComponentModel
>('AssessmentComponent', AssessmentComponentSchema);
