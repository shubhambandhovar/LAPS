/**
 * ReportCard Model — Collection #42
 *
 * Compiled end-of-term printable student report card with full revision history and attendance integration.
 */

import { Schema, model, Document, Types } from 'mongoose';
import {
  ReportCardStatus,
  ReportCardSubjectSummary,
  AttendanceSummary,
  MeritRanking,
  ReportCardRemarks,
  ReportCardVersionItem,
} from '@laps/shared';

export interface IReportCard {
  reportCardNumber: string;
  academicSessionId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  examId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  templateId?: Types.ObjectId;
  subjectResults: ReportCardSubjectSummary[];
  attendanceSummary: AttendanceSummary;
  meritRanking: MeritRanking;
  remarks?: ReportCardRemarks;
  promotionDecisionId?: Types.ObjectId;
  versionNumber: number;
  versionHistory: ReportCardVersionItem[];
  pdfUrl?: string;
  status: ReportCardStatus;
  publishedAt?: Date;
  publishedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedAt?: Date;
  archivedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReportCardDocument extends IReportCard, Document {}

const SubjectResultSummarySchema = new Schema(
  {
    classSubjectId: { type: String, required: true },
    subjectName: { type: String, required: true },
    theoryMarks: { type: Number, default: 0 },
    practicalMarks: { type: Number, default: 0 },
    internalMarks: { type: Number, default: 0 },
    totalMarks: { type: Number, required: true },
    maximumMarks: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String, required: true },
    gradePoint: { type: Number, default: 0 },
    remarks: { type: String },
  },
  { _id: false }
);

const AttendanceSummarySchema = new Schema(
  {
    workingDays: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    lateDays: { type: Number, default: 0 },
    attendancePercentage: { type: Number, default: 0 },
  },
  { _id: false }
);

const MeritRankingSchema = new Schema(
  {
    rankInClass: { type: Number },
    rankInSection: { type: Number },
    overallPercentage: { type: Number, required: true },
    gpa: { type: Number },
  },
  { _id: false }
);

const ReportCardRemarksSchema = new Schema(
  {
    classTeacherRemarks: { type: String },
    principalRemarks: { type: String },
    autoRemarks: { type: String },
  },
  { _id: false }
);

const ReportCardVersionItemSchema = new Schema(
  {
    versionNumber: { type: Number, required: true },
    generatedAt: { type: Date, required: true },
    generatedBy: { type: String, required: true },
    changeReason: { type: String },
    pdfUrl: { type: String },
  },
  { _id: false }
);

const ReportCardSchema = new Schema<IReportCardDocument>(
  {
    reportCardNumber: { type: String, required: true, trim: true },
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    academicTermId: { type: Schema.Types.ObjectId, ref: 'AcademicTerm', required: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'ReportCardTemplate' },
    subjectResults: [SubjectResultSummarySchema],
    attendanceSummary: { type: AttendanceSummarySchema, required: true },
    meritRanking: { type: MeritRankingSchema, required: true },
    remarks: { type: ReportCardRemarksSchema },
    promotionDecisionId: { type: Schema.Types.ObjectId, ref: 'PromotionDecision' },
    versionNumber: { type: Number, default: 1 },
    versionHistory: [ReportCardVersionItemSchema],
    pdfUrl: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

ReportCardSchema.index({ examId: 1, enrollmentId: 1 }, { unique: true });
ReportCardSchema.index({ reportCardNumber: 1 }, { unique: true });
ReportCardSchema.index({ academicSessionId: 1, classId: 1, sectionId: 1, status: 1 });
ReportCardSchema.index({ studentId: 1, status: 1 });

export const ReportCard = model<IReportCardDocument>('ReportCard', ReportCardSchema);
