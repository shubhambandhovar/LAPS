import { z } from 'zod';

// ==========================================
// 1. STATUS ENUMS
// ==========================================

export const ReportCardStatusEnum = z.enum([
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
]);
export type ReportCardStatus = z.infer<typeof ReportCardStatusEnum>;

export const ReportCardTemplateStatusEnum = z.enum([
  'ACTIVE',
  'ARCHIVED',
]);
export type ReportCardTemplateStatus = z.infer<typeof ReportCardTemplateStatusEnum>;

export const PromotionStatusEnum = z.enum([
  'PROMOTED',
  'PROMOTED_CONDITIONALLY',
  'DETAINED',
  'COMPLETED',
  'TC_ELIGIBLE',
]);
export type PromotionStatus = z.infer<typeof PromotionStatusEnum>;

export const PromotionDecisionStatusEnum = z.enum([
  'DRAFT',
  'APPROVED',
  'ARCHIVED',
]);
export type PromotionDecisionStatus = z.infer<typeof PromotionDecisionStatusEnum>;

// ==========================================
// 2. REPORT CARD TEMPLATE SCHEMAS
// ==========================================

export const ReportCardTemplateBrandingSchema = z.object({
  schoolLogoUrl: z.string().optional(),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  watermarkText: z.string().optional(),
  customCss: z.string().optional(),
});
export type ReportCardTemplateBranding = z.infer<typeof ReportCardTemplateBrandingSchema>;

export const ReportCardTemplateSignaturesSchema = z.object({
  showPrincipalSignature: z.boolean().default(true),
  principalSignatureUrl: z.string().optional(),
  principalTitle: z.string().default('Principal'),
  showClassTeacherSignature: z.boolean().default(true),
  classTeacherTitle: z.string().default('Class Teacher'),
});
export type ReportCardTemplateSignatures = z.infer<typeof ReportCardTemplateSignaturesSchema>;

export const ReportCardTemplateLayoutSchema = z.object({
  showGradingScale: z.boolean().default(true),
  showMarksBreakdown: z.boolean().default(true),
  showAttendance: z.boolean().default(true),
  showRemarks: z.boolean().default(true),
  showPromotionSection: z.boolean().default(true),
  showClassRank: z.boolean().default(true),
  showSectionRank: z.boolean().default(true),
});
export type ReportCardTemplateLayout = z.infer<typeof ReportCardTemplateLayoutSchema>;

export const CreateReportCardTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  description: z.string().optional(),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  classIds: z.array(z.string()).optional(),
  isDefault: z.boolean().optional().default(false),
  branding: ReportCardTemplateBrandingSchema.optional().default({}),
  signatures: ReportCardTemplateSignaturesSchema.optional().default({
    showPrincipalSignature: true,
    principalTitle: 'Principal',
    showClassTeacherSignature: true,
    classTeacherTitle: 'Class Teacher',
  }),
  layout: ReportCardTemplateLayoutSchema.optional().default({
    showGradingScale: true,
    showMarksBreakdown: true,
    showAttendance: true,
    showRemarks: true,
    showPromotionSection: true,
    showClassRank: true,
    showSectionRank: true,
  }),
  status: ReportCardTemplateStatusEnum.optional().default('ACTIVE'),
});
export type CreateReportCardTemplateInput = z.infer<typeof CreateReportCardTemplateSchema>;

export const UpdateReportCardTemplateSchema = CreateReportCardTemplateSchema.partial();
export type UpdateReportCardTemplateInput = z.infer<typeof UpdateReportCardTemplateSchema>;

export const ReportCardTemplateSchema = CreateReportCardTemplateSchema.extend({
  _id: z.string(),
  createdAt: z.string().datetime().or(z.date()).optional(),
  updatedAt: z.string().datetime().or(z.date()).optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});
export type ReportCardTemplate = z.infer<typeof ReportCardTemplateSchema>;

// ==========================================
// 3. REPORT CARD COMPONENT SUB-SCHEMAS
// ==========================================

export const ReportCardSubjectSummarySchema = z.object({
  classSubjectId: z.string(),
  subjectName: z.string(),
  theoryMarks: z.number().default(0),
  practicalMarks: z.number().default(0),
  internalMarks: z.number().default(0),
  totalMarks: z.number(),
  maximumMarks: z.number(),
  percentage: z.number(),
  grade: z.string(),
  gradePoint: z.number().default(0),
  remarks: z.string().optional(),
});
export type ReportCardSubjectSummary = z.infer<typeof ReportCardSubjectSummarySchema>;

export const AttendanceSummarySchema = z.object({
  workingDays: z.number().default(0),
  presentDays: z.number().default(0),
  absentDays: z.number().default(0),
  leaveDays: z.number().default(0),
  lateDays: z.number().default(0),
  attendancePercentage: z.number().default(0),
});
export type AttendanceSummary = z.infer<typeof AttendanceSummarySchema>;

export const MeritRankingSchema = z.object({
  rankInClass: z.number().optional(),
  rankInSection: z.number().optional(),
  overallPercentage: z.number(),
  gpa: z.number().optional(),
});
export type MeritRanking = z.infer<typeof MeritRankingSchema>;

export const ReportCardRemarksSchema = z.object({
  classTeacherRemarks: z.string().optional(),
  principalRemarks: z.string().optional(),
  autoRemarks: z.string().optional(),
});
export type ReportCardRemarks = z.infer<typeof ReportCardRemarksSchema>;

export const ReportCardVersionItemSchema = z.object({
  versionNumber: z.number(),
  generatedAt: z.string().datetime().or(z.date()),
  generatedBy: z.string(),
  changeReason: z.string().optional(),
  pdfUrl: z.string().optional(),
});
export type ReportCardVersionItem = z.infer<typeof ReportCardVersionItemSchema>;

// ==========================================
// 4. REPORT CARD SCHEMAS & INPUTS
// ==========================================

export const GenerateReportCardSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  academicTermId: z.string().min(1, 'Academic term ID is required'),
  examId: z.string().min(1, 'Exam ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().optional(),
  enrollmentId: z.string().optional(),
  templateId: z.string().optional(),
  changeReason: z.string().optional(),
});
export type GenerateReportCardInput = z.infer<typeof GenerateReportCardSchema>;

export const UpdateReportCardRemarksSchema = z.object({
  classTeacherRemarks: z.string().optional(),
  principalRemarks: z.string().optional(),
  autoRemarks: z.string().optional(),
});
export type UpdateReportCardRemarksInput = z.infer<typeof UpdateReportCardRemarksSchema>;

export const PublishReportCardsSchema = z.object({
  reportCardIds: z.array(z.string()).min(1, 'At least one report card ID is required'),
});
export type PublishReportCardsInput = z.infer<typeof PublishReportCardsSchema>;

export const ReportCardSchema = z.object({
  _id: z.string(),
  reportCardNumber: z.string(),
  academicSessionId: z.string(),
  academicTermId: z.string(),
  examId: z.string(),
  enrollmentId: z.string(),
  studentId: z.string(),
  classId: z.string(),
  sectionId: z.string(),
  templateId: z.string().optional(),
  subjectResults: z.array(ReportCardSubjectSummarySchema),
  attendanceSummary: AttendanceSummarySchema,
  meritRanking: MeritRankingSchema,
  remarks: ReportCardRemarksSchema.optional(),
  promotionDecisionId: z.string().optional(),
  versionNumber: z.number().default(1),
  versionHistory: z.array(ReportCardVersionItemSchema).optional().default([]),
  pdfUrl: z.string().optional(),
  status: ReportCardStatusEnum,
  publishedAt: z.string().datetime().or(z.date()).optional(),
  publishedBy: z.string().optional(),
  createdAt: z.string().datetime().or(z.date()).optional(),
  updatedAt: z.string().datetime().or(z.date()).optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});
export type ReportCard = z.infer<typeof ReportCardSchema>;

// ==========================================
// 5. REPORT CARD VERSION SNAPSHOT SCHEMAS
// ==========================================

export const ReportCardVersionSchema = z.object({
  _id: z.string(),
  reportCardId: z.string(),
  versionNumber: z.number(),
  generatedAt: z.string().datetime().or(z.date()),
  generatedBy: z.string(),
  changeReason: z.string().optional(),
  snapshotData: z.any(),
  pdfUrl: z.string().optional(),
  createdAt: z.string().datetime().or(z.date()).optional(),
  updatedAt: z.string().datetime().or(z.date()).optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});
export type ReportCardVersion = z.infer<typeof ReportCardVersionSchema>;

// ==========================================
// 6. PROMOTION DECISION SCHEMAS
// ==========================================

export const EvaluatePromotionSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  academicTermId: z.string().min(1, 'Academic term ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().optional(),
  minPassPercentage: z.number().min(0).max(100).optional().default(33),
  minAttendancePercentage: z.number().min(0).max(100).optional().default(75),
});
export type EvaluatePromotionInput = z.infer<typeof EvaluatePromotionSchema>;

export const CreatePromotionDecisionSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  academicTermId: z.string().min(1, 'Academic term ID is required'),
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  fromClassId: z.string().min(1, 'From class ID is required'),
  fromSectionId: z.string().min(1, 'From section ID is required'),
  toClassId: z.string().optional(),
  toSectionId: z.string().optional(),
  promotionStatus: PromotionStatusEnum,
  remarks: z.string().optional(),
  status: PromotionDecisionStatusEnum.optional().default('DRAFT'),
});
export type CreatePromotionDecisionInput = z.infer<typeof CreatePromotionDecisionSchema>;

export const UpdatePromotionDecisionSchema = CreatePromotionDecisionSchema.partial();
export type UpdatePromotionDecisionInput = z.infer<typeof UpdatePromotionDecisionSchema>;

export const ApprovePromotionsSchema = z.object({
  promotionIds: z.array(z.string()).min(1, 'At least one promotion ID is required'),
});
export type ApprovePromotionsInput = z.infer<typeof ApprovePromotionsSchema>;

export const PromotionDecisionSchema = CreatePromotionDecisionSchema.extend({
  _id: z.string(),
  decidedBy: z.string().optional(),
  decidedAt: z.string().datetime().or(z.date()).optional(),
  createdAt: z.string().datetime().or(z.date()).optional(),
  updatedAt: z.string().datetime().or(z.date()).optional(),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional(),
});
export type PromotionDecision = z.infer<typeof PromotionDecisionSchema>;
