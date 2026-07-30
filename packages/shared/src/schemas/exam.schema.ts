import { z } from 'zod';

// ==========================================
// 1. EXAM SCHEMAS & TYPES
// ==========================================

export const ExamTypeEnum = z.enum([
  'UNIT_TEST',
  'MID_TERM',
  'FINAL',
  'PRACTICAL',
  'QUIZ',
  'MOCK',
]);
export type ExamType = z.infer<typeof ExamTypeEnum>;

export const ExamStatusEnum = z.enum([
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'COMPLETED',
  'ARCHIVED',
]);
export type ExamStatus = z.infer<typeof ExamStatusEnum>;

export const CreateExamSchema = z.object({
  name: z.string().min(1, 'Exam name is required'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  academicTermId: z.string().min(1, 'Academic term ID is required'),
  examType: ExamTypeEnum,
  status: ExamStatusEnum.optional().default('DRAFT'),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
});
export type CreateExamInput = z.infer<typeof CreateExamSchema>;

export const UpdateExamSchema = CreateExamSchema.partial();
export type UpdateExamInput = z.infer<typeof UpdateExamSchema>;

export interface ExamResponse {
  _id: string;
  name: string;
  academicSessionId: string;
  academicTermId: string;
  examType: ExamType;
  status: ExamStatus;
  startDate?: string | Date;
  endDate?: string | Date;
  description?: string;
  instructions?: string;
  publishedAt?: string | Date;
  publishedBy?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  archivedAt?: string | Date;
  archivedBy?: string;
}

// ==========================================
// 2. EXAM SCHEDULE SCHEMAS & TYPES
// ==========================================

export const ExamScheduleStatusEnum = z.enum([
  'SCHEDULED',
  'RESCHEDULED',
  'CANCELLED',
  'COMPLETED',
  'ARCHIVED',
]);
export type ExamScheduleStatus = z.infer<typeof ExamScheduleStatusEnum>;

export const CreateExamScheduleSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  academicTermId: z.string().min(1, 'Academic term ID is required'),
  classSubjectId: z.string().min(1, 'Class subject ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().optional(),
  subjectId: z.string().min(1, 'Subject ID is required'),
  date: z.string().datetime().or(z.date()),
  startTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Valid HH:mm format required'),
  endTime: z.string().regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, 'Valid HH:mm format required'),
  durationMinutes: z.number().positive('Duration must be positive'),
  roomId: z.string().optional(),
  room: z.string().optional(),
  invigilatorId: z.string().optional(),
  maximumMarks: z.number().positive('Maximum marks must be positive').default(100),
  passingMarks: z.number().nonnegative('Passing marks must be non-negative').default(33),
  status: ExamScheduleStatusEnum.optional().default('SCHEDULED'),
});
export type CreateExamScheduleInput = z.infer<typeof CreateExamScheduleSchema>;

export const UpdateExamScheduleSchema = CreateExamScheduleSchema.partial();
export type UpdateExamScheduleInput = z.infer<typeof UpdateExamScheduleSchema>;

export interface ExamScheduleResponse {
  _id: string;
  examId: string;
  academicSessionId: string;
  academicTermId: string;
  classSubjectId: string;
  classId: string;
  sectionId?: string;
  subjectId: string;
  date: string | Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  roomId?: string;
  room?: string;
  invigilatorId?: string;
  maximumMarks: number;
  passingMarks: number;
  status: ExamScheduleStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ==========================================
// 3. ASSESSMENT COMPONENT SCHEMAS & TYPES
// ==========================================

export const AssessmentComponentNameEnum = z.enum([
  'THEORY',
  'PRACTICAL',
  'PROJECT',
  'ORAL',
  'INTERNAL',
  'OTHER',
]);
export type AssessmentComponentName = z.infer<typeof AssessmentComponentNameEnum>;

export const AssessmentComponentStatusEnum = z.enum(['ACTIVE', 'ARCHIVED']);
export type AssessmentComponentStatus = z.infer<typeof AssessmentComponentStatusEnum>;

export const CreateAssessmentComponentSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  classSubjectId: z.string().min(1, 'Class subject ID is required'),
  componentName: AssessmentComponentNameEnum,
  weightage: z.number().min(0).max(100, 'Weightage must be between 0 and 100'),
  maximumMarks: z.number().positive('Maximum marks must be positive'),
  passingMarks: z.number().nonnegative('Passing marks must be non-negative'),
  isMandatoryToPass: z.boolean().default(true),
  orderSequence: z.number().default(0),
  status: AssessmentComponentStatusEnum.optional().default('ACTIVE'),
});
export type CreateAssessmentComponentInput = z.infer<typeof CreateAssessmentComponentSchema>;

export const UpdateAssessmentComponentSchema = CreateAssessmentComponentSchema.partial();
export type UpdateAssessmentComponentInput = z.infer<typeof UpdateAssessmentComponentSchema>;

export interface AssessmentComponentResponse {
  _id: string;
  examId: string;
  classSubjectId: string;
  componentName: AssessmentComponentName;
  weightage: number;
  maximumMarks: number;
  passingMarks: number;
  isMandatoryToPass: boolean;
  orderSequence: number;
  status: AssessmentComponentStatus;
}

// ==========================================
// 4. MARKS ENTRY SCHEMAS & TYPES
// ==========================================

export const MarksEntryStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'LOCKED',
  'PUBLISHED',
  'ARCHIVED',
]);
export type MarksEntryStatus = z.infer<typeof MarksEntryStatusEnum>;

export const ComponentMarkItemSchema = z.object({
  assessmentComponentId: z.string().min(1, 'Component ID is required'),
  componentName: z.string().min(1, 'Component name is required'),
  marksObtained: z.number().nonnegative('Marks obtained must be non-negative').default(0),
  isAbsent: z.boolean().default(false),
  isMedical: z.boolean().default(false),
  isExempt: z.boolean().default(false),
});
export type ComponentMarkItemInput = z.infer<typeof ComponentMarkItemSchema>;

export const CreateMarksEntrySchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  academicTermId: z.string().min(1, 'Academic term ID is required'),
  classSubjectId: z.string().min(1, 'Class subject ID is required'),
  teachingAssignmentId: z.string().min(1, 'Teaching assignment ID is required'),
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  componentMarks: z.array(ComponentMarkItemSchema).min(1, 'At least one component mark required'),
  isAbsent: z.boolean().default(false),
  isMedical: z.boolean().default(false),
  isExempt: z.boolean().default(false),
  graceMarksAwarded: z.number().nonnegative().default(0),
  remarks: z.string().optional(),
  status: MarksEntryStatusEnum.optional().default('DRAFT'),
});
export type CreateMarksEntryInput = z.infer<typeof CreateMarksEntrySchema>;

export const UpdateMarksEntrySchema = CreateMarksEntrySchema.partial();
export type UpdateMarksEntryInput = z.infer<typeof UpdateMarksEntrySchema>;

export const BulkMarksEntryItemSchema = z.object({
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  componentMarks: z.array(ComponentMarkItemSchema).min(1, 'At least one component mark required'),
  isAbsent: z.boolean().default(false),
  isMedical: z.boolean().default(false),
  isExempt: z.boolean().default(false),
  remarks: z.string().optional(),
});
export type BulkMarksEntryItemInput = z.infer<typeof BulkMarksEntryItemSchema>;

export const BulkMarksEntryRequestSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  academicTermId: z.string().min(1, 'Academic term ID is required'),
  classSubjectId: z.string().min(1, 'Class subject ID is required'),
  teachingAssignmentId: z.string().min(1, 'Teaching assignment ID is required'),
  entries: z.array(BulkMarksEntryItemSchema).min(1, 'At least one student mark entry is required'),
  submit: z.boolean().default(false),
});
export type BulkMarksEntryRequestInput = z.infer<typeof BulkMarksEntryRequestSchema>;

export const AwardGraceMarksSchema = z.object({
  graceMarksAwarded: z.number().nonnegative('Grace marks must be non-negative'),
  reason: z.string().min(1, 'Reason for awarding grace marks is required'),
});
export type AwardGraceMarksInput = z.infer<typeof AwardGraceMarksSchema>;

export interface MarksRevisionHistoryItem {
  modifiedBy: string;
  modifiedAt: string | Date;
  previousTotal: number;
  newTotal: number;
  reason: string;
  status: MarksEntryStatus;
}

export interface MarksEntryResponse {
  _id: string;
  examId: string;
  academicSessionId: string;
  academicTermId: string;
  classSubjectId: string;
  teachingAssignmentId: string;
  enrollmentId: string;
  studentId: string;
  componentMarks: {
    assessmentComponentId: string;
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
  submittedAt?: string | Date;
  submittedBy?: string;
  lockedAt?: string | Date;
  lockedBy?: string;
  publishedAt?: string | Date;
  publishedBy?: string;
  history: MarksRevisionHistoryItem[];
}

// ==========================================
// 5. GRADE SCALE SCHEMAS & TYPES
// ==========================================

export const GradeScaleTypeEnum = z.enum([
  'PERCENTAGE',
  'ABSOLUTE',
  'GPA',
  'CUSTOM',
]);
export type GradeScaleType = z.infer<typeof GradeScaleTypeEnum>;

export const GradeScaleStatusEnum = z.enum(['ACTIVE', 'ARCHIVED']);
export type GradeScaleStatus = z.infer<typeof GradeScaleStatusEnum>;

export const GradeIntervalSchema = z.object({
  grade: z.string().min(1, 'Grade symbol required'),
  gradePoint: z.number().nonnegative('Grade point must be non-negative'),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  description: z.string().optional(),
  isPassing: z.boolean().default(true),
});
export type GradeIntervalInput = z.infer<typeof GradeIntervalSchema>;

export const CreateGradeScaleSchema = z.object({
  name: z.string().min(1, 'Grade scale name is required'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  classIds: z.array(z.string()).optional(),
  isDefault: z.boolean().default(false),
  scaleType: GradeScaleTypeEnum,
  grades: z.array(GradeIntervalSchema).min(1, 'At least one grade interval required'),
  status: GradeScaleStatusEnum.optional().default('ACTIVE'),
});
export type CreateGradeScaleInput = z.infer<typeof CreateGradeScaleSchema>;

export const UpdateGradeScaleSchema = CreateGradeScaleSchema.partial();
export type UpdateGradeScaleInput = z.infer<typeof UpdateGradeScaleSchema>;

export interface GradeScaleResponse {
  _id: string;
  name: string;
  academicSessionId: string;
  classIds?: string[];
  isDefault: boolean;
  scaleType: GradeScaleType;
  grades: {
    grade: string;
    gradePoint: number;
    minPercentage: number;
    maxPercentage: number;
    description?: string;
    isPassing: boolean;
  }[];
  status: GradeScaleStatus;
}

// ==========================================
// 6. RESULT SCHEMAS & TYPES
// ==========================================

export const ResultStatusEnum = z.enum([
  'PASS',
  'FAIL',
  'COMPARTMENT',
  'WITHHELD',
  'EXEMPT',
]);
export type ResultStatus = z.infer<typeof ResultStatusEnum>;

export const ResultLifecycleStatusEnum = z.enum([
  'DRAFT',
  'CALCULATED',
  'LOCKED',
  'PUBLISHED',
  'ARCHIVED',
]);
export type ResultLifecycleStatus = z.infer<typeof ResultLifecycleStatusEnum>;

export const SubjectResultSummarySchema = z.object({
  classSubjectId: z.string().min(1),
  subjectId: z.string().min(1),
  subjectName: z.string().min(1),
  subjectCode: z.string().min(1),
  marksEntryId: z.string().min(1),
  totalMarksObtained: z.number().nonnegative(),
  maximumMarks: z.number().positive(),
  passingMarks: z.number().nonnegative(),
  percentage: z.number().nonnegative(),
  grade: z.string().min(1),
  gradePoint: z.number().nonnegative(),
  isPassed: z.boolean(),
  isAbsent: z.boolean(),
  isExempt: z.boolean(),
  graceMarks: z.number().nonnegative().default(0),
});
export type SubjectResultSummaryInput = z.infer<typeof SubjectResultSummarySchema>;

export const CalculateResultRequestSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().optional(),
});
export type CalculateResultRequestInput = z.infer<typeof CalculateResultRequestSchema>;

export const PublishResultRequestSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().optional(),
});
export type PublishResultRequestInput = z.infer<typeof PublishResultRequestSchema>;

export interface GraceRuleAppliedItem {
  subjectId: string;
  graceMarksAwarded: number;
  ruleReason: string;
}

export interface ResultResponse {
  _id: string;
  examId: string;
  academicSessionId: string;
  academicTermId: string;
  enrollmentId: string;
  studentId: string;
  classId: string;
  sectionId: string;
  subjectResults: {
    classSubjectId: string;
    subjectId: string;
    subjectName: string;
    subjectCode: string;
    marksEntryId: string;
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
  }[];
  overallTotalObtained: number;
  overallMaximumMarks: number;
  overallPercentage: number;
  overallGrade: string;
  overallGradePoint: number;
  rankInClass?: number;
  rankInSection?: number;
  resultStatus: ResultStatus;
  graceRulesApplied: GraceRuleAppliedItem[];
  status: ResultLifecycleStatus;
  calculatedAt?: string | Date;
  calculatedBy?: string;
  publishedAt?: string | Date;
  publishedBy?: string;
}

// ==========================================
// 7. RE-EVALUATION REQUEST SCHEMAS & TYPES
// ==========================================

export const ReEvaluationTypeEnum = z.enum([
  'RE_COUNTING',
  'RE_EVALUATION',
  'ANSWER_SCRIPT_VIEW',
]);
export type ReEvaluationType = z.infer<typeof ReEvaluationTypeEnum>;

export const ReEvaluationStatusEnum = z.enum([
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED_FOR_EVALUATION',
  'COMPLETED',
  'REJECTED',
  'ARCHIVED',
]);
export type ReEvaluationStatus = z.infer<typeof ReEvaluationStatusEnum>;

export const CreateReEvaluationRequestSchema = z.object({
  examId: z.string().min(1, 'Exam ID is required'),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  academicTermId: z.string().min(1, 'Academic term ID is required'),
  marksEntryId: z.string().min(1, 'Marks entry ID is required'),
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  classSubjectId: z.string().min(1, 'Class subject ID is required'),
  requestType: ReEvaluationTypeEnum,
  reason: z.string().min(1, 'Reason for request is required'),
});
export type CreateReEvaluationRequestInput = z.infer<typeof CreateReEvaluationRequestSchema>;

export const ReviewReEvaluationSchema = z.object({
  status: z.enum(['APPROVED_FOR_EVALUATION', 'REJECTED']),
  evaluatorTeacherId: z.string().optional(),
  reviewRemarks: z.string().optional(),
});
export type ReviewReEvaluationInput = z.infer<typeof ReviewReEvaluationSchema>;

export const CompleteReEvaluationSchema = z.object({
  revisedMarks: z.number().nonnegative('Revised marks must be non-negative'),
  revisedGrade: z.string().min(1, 'Revised grade is required'),
  evaluationRemarks: z.string().min(1, 'Evaluation remarks required'),
});
export type CompleteReEvaluationInput = z.infer<typeof CompleteReEvaluationSchema>;

export interface ReEvaluationAuditTrailItem {
  action: string;
  timestamp: string | Date;
  userId: string;
  previousMarks?: number;
  newMarks?: number;
  comment?: string;
}

export interface ReEvaluationRequestResponse {
  _id: string;
  examId: string;
  academicSessionId: string;
  academicTermId: string;
  marksEntryId: string;
  enrollmentId: string;
  studentId: string;
  classSubjectId: string;
  requestType: ReEvaluationType;
  reason: string;
  previousMarks: number;
  previousGrade: string;
  revisedMarks?: number;
  revisedGrade?: string;
  marksChanged: boolean;
  status: ReEvaluationStatus;
  reviewedBy?: string;
  reviewedAt?: string | Date;
  evaluatorTeacherId?: string;
  evaluationRemarks?: string;
  completedAt?: string | Date;
  auditTrail: ReEvaluationAuditTrailItem[];
}

// ==========================================
// 8. EXAM ANALYTICS SUMMARY TYPES
// ==========================================

export interface TopPerformerSummaryItem {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  rollNumber?: string;
  totalObtained: number;
  percentage: number;
  rank: number;
}

export interface ExamAnalyticsSummaryResponse {
  _id: string;
  academicSessionId: string;
  examId: string;
  classId: string;
  sectionId?: string;
  subjectId?: string;
  teacherId?: string;
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
  lastCalculatedAt: string | Date;
}
