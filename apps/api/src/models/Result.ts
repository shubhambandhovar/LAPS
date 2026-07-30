/**
 * Result Model — Collection #39
 *
 * Governs consolidated student examination results across all enrolled subjects,
 * including GPA/CGPA, class/section rank, pass/fail status, and grace mark rules.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { ResultStatus, ResultLifecycleStatus, GraceRuleAppliedItem } from '@laps/shared';

export interface ISubjectResultItem {
  classSubjectId: Types.ObjectId;
  subjectId: Types.ObjectId;
  subjectName: string;
  subjectCode: string;
  marksEntryId: Types.ObjectId;
  totalMarksObtained: number;
  maximumMarks: number;
  passingMarks: number;
  percentage: number;
  grade: string;
  gradePoint: number;
  isPassed: boolean;
  isAbsent: boolean;
  isExempt: boolean;
  graceMarks: number;
}

export interface IResult {
  examId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
  academicTermId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  subjectResults: ISubjectResultItem[];
  overallTotalObtained: number;
  overallMaximumMarks: number;
  overallPercentage: number;
  overallGrade: string;
  overallGradePoint: number; // CGPA/GPA
  rankInClass?: number;
  rankInSection?: number;
  resultStatus: ResultStatus; // PASS, FAIL, COMPARTMENT, WITHHELD, EXEMPT
  graceRulesApplied: GraceRuleAppliedItem[];
  status: ResultLifecycleStatus; // DRAFT, CALCULATED, LOCKED, PUBLISHED, ARCHIVED
  calculatedAt?: Date;
  calculatedBy?: Types.ObjectId;
  publishedAt?: Date;
  publishedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResultDocument extends IResult, Document {}

const SubjectResultItemSchema = new Schema<ISubjectResultItem>(
  {
    classSubjectId: { type: Schema.Types.ObjectId, ref: 'ClassSubject', required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true },
    marksEntryId: { type: Schema.Types.ObjectId, ref: 'MarksEntry', required: true },
    totalMarksObtained: { type: Number, required: true, default: 0 },
    maximumMarks: { type: Number, required: true, default: 100 },
    passingMarks: { type: Number, required: true, default: 33 },
    percentage: { type: Number, required: true, default: 0 },
    grade: { type: String, required: true, default: '' },
    gradePoint: { type: Number, required: true, default: 0 },
    isPassed: { type: Boolean, default: true },
    isAbsent: { type: Boolean, default: false },
    isExempt: { type: Boolean, default: false },
    graceMarks: { type: Number, default: 0 },
  },
  { _id: false }
);

const GraceRuleAppliedSchema = new Schema<GraceRuleAppliedItem>(
  {
    subjectId: { type: String, required: true },
    graceMarksAwarded: { type: Number, required: true },
    ruleReason: { type: String, required: true },
  },
  { _id: false }
);

const ResultSchema = new Schema<IResultDocument>(
  {
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    academicTermId: { type: Schema.Types.ObjectId, ref: 'AcademicTerm', required: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    subjectResults: [SubjectResultItemSchema],
    overallTotalObtained: { type: Number, required: true, default: 0 },
    overallMaximumMarks: { type: Number, required: true, default: 100 },
    overallPercentage: { type: Number, required: true, default: 0 },
    overallGrade: { type: String, default: '' },
    overallGradePoint: { type: Number, default: 0 },
    rankInClass: { type: Number },
    rankInSection: { type: Number },
    resultStatus: {
      type: String,
      enum: ['PASS', 'FAIL', 'COMPARTMENT', 'WITHHELD', 'EXEMPT'],
      required: true,
      default: 'PASS',
    },
    graceRulesApplied: [GraceRuleAppliedSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'CALCULATED', 'LOCKED', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    calculatedAt: { type: Date },
    calculatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date },
    publishedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

ResultSchema.index({ examId: 1, classId: 1, sectionId: 1, status: 1 });
ResultSchema.index({ examId: 1, enrollmentId: 1 }, { unique: true });
ResultSchema.index({ examId: 1, classId: 1, overallPercentage: -1 });

export const Result = model<IResultDocument>('Result', ResultSchema);
