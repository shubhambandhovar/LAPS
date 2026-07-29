import { z } from 'zod';

// ==========================================
// 1. HOMEWORK SCHEMAS & TYPES
// ==========================================

export const HomeworkTypeEnum = z.enum([
  'HOMEWORK',
  'ASSIGNMENT',
  'PROJECT',
  'ACTIVITY',
  'READING',
]);
export type HomeworkType = z.infer<typeof HomeworkTypeEnum>;

export const HomeworkAttachmentTypeEnum = z.enum([
  'PDF',
  'IMAGE',
  'VIDEO',
  'LINK',
  'ZIP',
  'DOCUMENT',
]);
export type HomeworkAttachmentType = z.infer<typeof HomeworkAttachmentTypeEnum>;

export const HomeworkAttachmentSchema = z.object({
  type: HomeworkAttachmentTypeEnum,
  url: z.string().url('Attachment must be a valid URL'),
  title: z.string().optional(),
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().nonnegative('File size must be non-negative'),
  mimeType: z.string().min(1, 'MIME type is required'),
  uploadedAt: z.string().datetime().or(z.date()).optional(),
});
export type HomeworkAttachment = z.infer<typeof HomeworkAttachmentSchema>;

export const HomeworkStatusEnum = z.enum([
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'CLOSED',
  'ARCHIVED',
]);
export type HomeworkStatus = z.infer<typeof HomeworkStatusEnum>;

export const CreateHomeworkSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  teachingAssignmentId: z.string().min(1, 'Teaching assignment ID is required'),
  classSubjectId: z.string().min(1, 'Class subject ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  teacherId: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  homeworkType: HomeworkTypeEnum.default('HOMEWORK'),
  maxAttempts: z.number().int().positive().default(1),
  attachments: z.array(HomeworkAttachmentSchema).default([]),
  assignedDate: z.string().datetime().or(z.date()),
  dueDate: z.string().datetime().or(z.date()),
  scheduledPublishAt: z.string().datetime().or(z.date()).optional(),
  maxMarks: z.number().nonnegative().optional(),
  status: HomeworkStatusEnum.default('DRAFT'),
});
export type CreateHomeworkInput = z.infer<typeof CreateHomeworkSchema>;

export const UpdateHomeworkSchema = CreateHomeworkSchema.partial();
export type UpdateHomeworkInput = z.infer<typeof UpdateHomeworkSchema>;

export const HomeworkFilterQuerySchema = z.object({
  academicSessionId: z.string().optional(),
  teachingAssignmentId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  status: HomeworkStatusEnum.optional(),
  homeworkType: HomeworkTypeEnum.optional(),
  search: z.string().optional(),
  page: z.string().or(z.number()).optional(),
  limit: z.string().or(z.number()).optional(),
});
export type HomeworkFilterQuery = z.infer<typeof HomeworkFilterQuerySchema>;

// ==========================================
// 2. RUBRIC TEMPLATE SCHEMAS & TYPES
// ==========================================

export const RubricCriterionSchema = z.object({
  criterion: z.string().min(1, 'Criterion name is required'),
  maxMarks: z.number().positive('Max marks must be positive'),
  description: z.string().optional(),
});
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

export const CreateRubricTemplateSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  title: z.string().min(1, 'Rubric title is required').max(150),
  description: z.string().optional(),
  subjectId: z.string().optional(),
  createdByTeacherId: z.string().optional(),
  criteria: z.array(RubricCriterionSchema).min(1, 'At least one criterion is required'),
  isShared: z.boolean().default(false),
});
export type CreateRubricTemplateInput = z.infer<typeof CreateRubricTemplateSchema>;

export const UpdateRubricTemplateSchema = CreateRubricTemplateSchema.partial();
export type UpdateRubricTemplateInput = z.infer<typeof UpdateRubricTemplateSchema>;

// ==========================================
// 3. HOMEWORK SUBMISSION & EVALUATION SCHEMAS
// ==========================================

export const HomeworkSubmissionStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'EVALUATED',
  'RETURNED',
  'ARCHIVED',
]);
export type HomeworkSubmissionStatus = z.infer<typeof HomeworkSubmissionStatusEnum>;

export const PlagiarismStatusEnum = z.enum([
  'NOT_CHECKED',
  'CHECKED',
]);
export type PlagiarismStatus = z.infer<typeof PlagiarismStatusEnum>;

export const HomeworkEvaluationRubricItemSchema = z.object({
  criterion: z.string().min(1),
  marksAwarded: z.number().nonnegative(),
  maxMarks: z.number().positive().optional(),
  comment: z.string().optional(),
});
export type HomeworkEvaluationRubricItem = z.infer<typeof HomeworkEvaluationRubricItemSchema>;

export const HomeworkEvaluationSchema = z.object({
  rubricTemplateId: z.string().optional(),
  marks: z.number().nonnegative().optional(),
  grade: z.string().optional(),
  remarks: z.string().optional(),
  rubric: z.array(HomeworkEvaluationRubricItemSchema).optional(),
  evaluatedBy: z.string().optional(),
  evaluatedAt: z.string().datetime().or(z.date()).optional(),
  returnedForResubmission: z.boolean().default(false),
});
export type HomeworkEvaluation = z.infer<typeof HomeworkEvaluationSchema>;

export const CreateSubmissionSchema = z.object({
  homeworkId: z.string().min(1, 'Homework ID is required'),
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  attachments: z.array(HomeworkAttachmentSchema).default([]),
  remarks: z.string().optional(),
  submittedAt: z.string().datetime().or(z.date()).optional(),
  status: HomeworkSubmissionStatusEnum.default('SUBMITTED'),
});
export type CreateSubmissionInput = z.infer<typeof CreateSubmissionSchema>;

export const UpdateSubmissionSchema = z.object({
  attachments: z.array(HomeworkAttachmentSchema).optional(),
  remarks: z.string().optional(),
  submittedAt: z.string().datetime().or(z.date()).optional(),
  status: HomeworkSubmissionStatusEnum.optional(),
});
export type UpdateSubmissionInput = z.infer<typeof UpdateSubmissionSchema>;

export const EvaluateSubmissionSchema = z.object({
  rubricTemplateId: z.string().optional(),
  marks: z.number().nonnegative().optional(),
  grade: z.string().optional(),
  remarks: z.string().optional(),
  rubric: z.array(HomeworkEvaluationRubricItemSchema).optional(),
  returnedForResubmission: z.boolean().default(false),
});
export type EvaluateSubmissionInput = z.infer<typeof EvaluateSubmissionSchema>;

export const SubmissionFilterQuerySchema = z.object({
  homeworkId: z.string().optional(),
  studentId: z.string().optional(),
  enrollmentId: z.string().optional(),
  status: HomeworkSubmissionStatusEnum.optional(),
  isLate: z.string().or(z.boolean()).optional(),
  page: z.string().or(z.number()).optional(),
  limit: z.string().or(z.number()).optional(),
});
export type SubmissionFilterQuery = z.infer<typeof SubmissionFilterQuerySchema>;

// ==========================================
// 4. STUDY MATERIAL SCHEMAS & TYPES
// ==========================================

export const StudyMaterialTypeEnum = z.enum([
  'NOTES',
  'PDF',
  'PRESENTATION',
  'VIDEO',
  'LINK',
  'REFERENCE_MATERIAL',
]);
export type StudyMaterialType = z.infer<typeof StudyMaterialTypeEnum>;

export const StudyMaterialVersionSchema = z.object({
  version: z.number().int().positive(),
  fileUrl: z.string().url(),
  materialType: StudyMaterialTypeEnum,
  changedAt: z.string().datetime().or(z.date()),
  changedBy: z.string(),
  changelog: z.string().optional(),
});
export type StudyMaterialVersion = z.infer<typeof StudyMaterialVersionSchema>;

export const CreateStudyMaterialSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  teachingAssignmentId: z.string().min(1, 'Teaching assignment ID is required'),
  classSubjectId: z.string().min(1, 'Class subject ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  subjectId: z.string().min(1, 'Subject ID is required'),
  uploaderTeacherId: z.string().optional(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  materialType: StudyMaterialTypeEnum,
  fileUrl: z.string().url('File URL is required'),
  fileMimeType: z.string().optional(),
  publishAt: z.string().datetime().or(z.date()).optional(),
  expireAt: z.string().datetime().or(z.date()).optional(),
  changelog: z.string().optional(),
});
export type CreateStudyMaterialInput = z.infer<typeof CreateStudyMaterialSchema>;

export const UpdateStudyMaterialSchema = CreateStudyMaterialSchema.partial().extend({
  changelog: z.string().optional(),
});
export type UpdateStudyMaterialInput = z.infer<typeof UpdateStudyMaterialSchema>;

export const StudyMaterialFilterQuerySchema = z.object({
  academicSessionId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  uploaderTeacherId: z.string().optional(),
  materialType: StudyMaterialTypeEnum.optional(),
  search: z.string().optional(),
  page: z.string().or(z.number()).optional(),
  limit: z.string().or(z.number()).optional(),
});
export type StudyMaterialFilterQuery = z.infer<typeof StudyMaterialFilterQuerySchema>;

// ==========================================
// 5. HOMEWORK & STUDY MATERIAL ANALYTICS SCHEMAS
// ==========================================

export const HomeworkAnalyticsQuerySchema = z.object({
  academicSessionId: z.string().optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  teacherId: z.string().optional(),
  month: z.string().or(z.number()).optional(),
  year: z.string().or(z.number()).optional(),
});
export type HomeworkAnalyticsQuery = z.infer<typeof HomeworkAnalyticsQuerySchema>;

export const HomeworkAnalyticsSummaryResponseSchema = z.object({
  totalAssigned: z.number().nonnegative(),
  totalSubmissions: z.number().nonnegative(),
  submissionPercentage: z.number().nonnegative(),
  pendingEvaluationCount: z.number().nonnegative(),
  pendingPercentage: z.number().nonnegative(),
  lateSubmissionCount: z.number().nonnegative(),
  latePercentage: z.number().nonnegative(),
  averageMarks: z.number().nonnegative(),
  classBreakdown: z.array(z.object({
    classId: z.string(),
    className: z.string(),
    totalAssigned: z.number(),
    submissionCount: z.number(),
    submissionPercentage: z.number(),
    averageMarks: z.number(),
  })),
  teacherBreakdown: z.array(z.object({
    teacherId: z.string(),
    teacherName: z.string(),
    totalAssigned: z.number(),
    submissionCount: z.number(),
    pendingEvaluationCount: z.number(),
  })),
});
export type HomeworkAnalyticsSummaryResponse = z.infer<typeof HomeworkAnalyticsSummaryResponseSchema>;
