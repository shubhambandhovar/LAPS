/**
 * GradeScale Model — Collection #38
 *
 * Governs grading scales (PERCENTAGE, ABSOLUTE, GPA, CUSTOM) with descending
 * percentage intervals and grade point mappings.
 */

import { Schema, model, Document, Types, Model } from 'mongoose';
import { GradeScaleType, GradeScaleStatus } from '@laps/shared';

export interface IGradeInterval {
  grade: string;
  gradePoint: number;
  minPercentage: number;
  maxPercentage: number;
  description?: string;
  isPassing: boolean;
}

export interface IGradeScale {
  name: string;
  academicSessionId: Types.ObjectId;
  classIds?: Types.ObjectId[];
  isDefault: boolean;
  scaleType: GradeScaleType;
  grades: IGradeInterval[];
  status: GradeScaleStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGradeScaleDocument extends IGradeScale, Document {
  resolveGrade(percentage: number): { grade: string; gradePoint: number; isPassing: boolean };
}

export interface IGradeScaleModel extends Model<IGradeScaleDocument> {
  getDefaultScale(academicSessionId: string | Types.ObjectId): Promise<IGradeScaleDocument | null>;
}

const GradeIntervalSchema = new Schema<IGradeInterval>(
  {
    grade: { type: String, required: true },
    gradePoint: { type: Number, required: true },
    minPercentage: { type: Number, required: true, min: 0, max: 100 },
    maxPercentage: { type: Number, required: true, min: 0, max: 100 },
    description: { type: String },
    isPassing: { type: Boolean, default: true },
  },
  { _id: false }
);

const GradeScaleSchema = new Schema<IGradeScaleDocument, IGradeScaleModel>(
  {
    name: { type: String, required: true, trim: true },
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    classIds: [{ type: Schema.Types.ObjectId, ref: 'Class' }],
    isDefault: { type: Boolean, default: false },
    scaleType: {
      type: String,
      enum: ['PERCENTAGE', 'ABSOLUTE', 'GPA', 'CUSTOM'],
      required: true,
      default: 'PERCENTAGE',
    },
    grades: [GradeIntervalSchema],
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

GradeScaleSchema.index({ academicSessionId: 1, isDefault: 1, status: 1 });

GradeScaleSchema.methods.resolveGrade = function (percentage: number) {
  if (!this.grades || this.grades.length === 0) {
    return { grade: 'N/A', gradePoint: 0, isPassing: true };
  }
  const match = this.grades.find(
    (item: IGradeInterval) => percentage >= item.minPercentage && percentage <= item.maxPercentage
  );
  if (match) {
    return {
      grade: match.grade,
      gradePoint: match.gradePoint,
      isPassing: match.isPassing,
    };
  }
  // Fallback if below minimum or above maximum
  const sorted = [...this.grades].sort((a, b) => a.minPercentage - b.minPercentage);
  const lowest = sorted[0];
  return {
    grade: lowest?.grade || 'F',
    gradePoint: lowest?.gradePoint || 0,
    isPassing: lowest?.isPassing || false,
  };
};

GradeScaleSchema.statics.getDefaultScale = async function (academicSessionId) {
  let defaultScale = await this.findOne({
    academicSessionId,
    isDefault: true,
    status: 'ACTIVE',
  });
  if (!defaultScale) {
    defaultScale = await this.findOne({
      academicSessionId,
      status: 'ACTIVE',
    });
  }
  return defaultScale;
};

export const GradeScale = model<IGradeScaleDocument, IGradeScaleModel>('GradeScale', GradeScaleSchema);
