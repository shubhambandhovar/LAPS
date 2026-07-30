/**
 * ExamAnalyticsSummary Model — Collection #41
 *
 * Materialized summary cache for high-performance examination reporting across
 * school-wide, subject-level, class-level, and teacher-level performance metrics.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { TopPerformerSummaryItem } from '@laps/shared';

export interface IExamAnalyticsSummary {
  academicSessionId: Types.ObjectId;
  examId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId?: Types.ObjectId;
  subjectId?: Types.ObjectId;
  teacherId?: Types.ObjectId;
  totalStudents: number;
  totalPassed: number;
  totalFailed: number;
  totalCompartment: number;
  totalAbsent: number;
  passPercentage: number;
  averagePercentage: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  gradeDistribution: Record<string, number>;
  topPerformers: TopPerformerSummaryItem[];
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExamAnalyticsSummaryDocument extends IExamAnalyticsSummary, Document {}

const TopPerformerSummarySchema = new Schema<TopPerformerSummaryItem>(
  {
    enrollmentId: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String },
    totalObtained: { type: Number, required: true },
    percentage: { type: Number, required: true },
    rank: { type: Number, required: true },
  },
  { _id: false }
);

const ExamAnalyticsSummarySchema = new Schema<IExamAnalyticsSummaryDocument>(
  {
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section' },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher' },
    totalStudents: { type: Number, required: true, default: 0 },
    totalPassed: { type: Number, required: true, default: 0 },
    totalFailed: { type: Number, required: true, default: 0 },
    totalCompartment: { type: Number, required: true, default: 0 },
    totalAbsent: { type: Number, required: true, default: 0 },
    passPercentage: { type: Number, required: true, default: 0 },
    averagePercentage: { type: Number, required: true, default: 0 },
    averageMarks: { type: Number, required: true, default: 0 },
    highestMarks: { type: Number, required: true, default: 0 },
    lowestMarks: { type: Number, required: true, default: 0 },
    gradeDistribution: { type: Schema.Types.Mixed, default: {} },
    topPerformers: [TopPerformerSummarySchema],
    lastCalculatedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

ExamAnalyticsSummarySchema.index(
  {
    academicSessionId: 1,
    examId: 1,
    classId: 1,
    sectionId: 1,
    subjectId: 1,
    teacherId: 1,
  },
  { unique: true }
);

export const ExamAnalyticsSummary = model<IExamAnalyticsSummaryDocument>(
  'ExamAnalyticsSummary',
  ExamAnalyticsSummarySchema
);
