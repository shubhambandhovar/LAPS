import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const AttendanceTypeEnum = z.enum(['DAILY', 'PERIOD']);
export const AttendanceSessionStatusEnum = z.enum(['DRAFT', 'SUBMITTED', 'LOCKED', 'FROZEN']);
export const AttendanceStatusEnum = z.enum([
  'PRESENT',
  'ABSENT',
  'LATE',
  'HALF_DAY',
  'MEDICAL_LEAVE',
  'APPROVED_LEAVE',
  'UNAPPROVED_LEAVE',
  'EXCUSED',
]);

export const AttendanceSourceEnum = z.enum([
  'MANUAL',
  'LEAVE',
  'SYSTEM',
  'IMPORT',
  'BIOMETRIC_RESERVED',
]);

export const LeaveTypeEnum = z.enum([
  'CASUAL',
  'MEDICAL',
  'EMERGENCY',
  'SPORTS',
  'OFFICIAL',
  'OTHER',
]);

export const LeaveStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']);
export const CorrectionStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export const ApplicantTypeEnum = z.enum(['STUDENT', 'TEACHER']);

export const AttendanceEntryInputSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  enrollmentId: z.string().min(1, 'Enrollment ID is required'),
  studentName: z.string().min(1, 'Student Name snapshot is required'),
  rollNumber: z.string().optional(),
  className: z.string().min(1, 'Class Name snapshot is required'),
  sectionName: z.string().min(1, 'Section Name snapshot is required'),
  attendanceStatus: AttendanceStatusEnum.default('PRESENT'),
  attendanceSource: AttendanceSourceEnum.default('MANUAL'),
  lateMinutes: z.number().int().min(0).max(1440).optional().default(0),
  remarks: z.string().max(200).optional(),
});

export type AttendanceEntryInput = z.infer<typeof AttendanceEntryInputSchema>;

export const CreateAttendanceBatchSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic Session ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  attendanceType: AttendanceTypeEnum.default('DAILY'),
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  timetablePeriodId: z.string().optional(),
  subjectId: z.string().optional(),
  teachingAssignmentId: z.string().min(1, 'Teaching Assignment ID is required'),
  sessionStatus: AttendanceSessionStatusEnum.optional().default('DRAFT'),
  entries: z.array(AttendanceEntryInputSchema).min(1, 'At least one attendance entry is required'),
});

export type CreateAttendanceBatchInput = z.infer<typeof CreateAttendanceBatchSchema>;

export const CreateBulkAttendanceSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic Session ID is required'),
  date: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD'),
  attendanceType: AttendanceTypeEnum.default('DAILY'),
  batches: z.array(CreateAttendanceBatchSchema).min(1, 'At least one batch is required'),
});

export type CreateBulkAttendanceInput = z.infer<typeof CreateBulkAttendanceSchema>;

export const ReopenAttendanceSchema = z.object({
  reason: z.string().min(5, 'Mandatory audit reason is required (min 5 characters)').max(500),
});

export type ReopenAttendanceInput = z.infer<typeof ReopenAttendanceSchema>;

export const CreateLeaveRequestSchema = z
  .object({
    academicSessionId: z.string().min(1, 'Academic Session ID is required'),
    applicantType: ApplicantTypeEnum,
    studentId: z.string().optional(),
    enrollmentId: z.string().optional(),
    teacherId: z.string().optional(),
    leaveType: LeaveTypeEnum,
    startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD'),
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(500),
    attachmentUrl: z.string().url('Must be a valid URL').optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate).getTime();
      const end = new Date(data.endDate).getTime();
      return end >= start;
    },
    {
      message: 'End date must be on or after start date',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (data.applicantType === 'STUDENT') {
        return !!data.studentId && !!data.enrollmentId;
      }
      if (data.applicantType === 'TEACHER') {
        return !!data.teacherId;
      }
      return true;
    },
    {
      message: 'Student ID/Enrollment ID required for student leave, Teacher ID required for teacher leave',
      path: ['applicantType'],
    }
  );

export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestSchema>;

export const ReviewLeaveRequestSchema = z.object({
  leaveStatus: z.enum(['APPROVED', 'REJECTED']),
  reviewerRemarks: z.string().max(300).optional(),
});

export type ReviewLeaveRequestInput = z.infer<typeof ReviewLeaveRequestSchema>;

export const CreateAttendanceCorrectionSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic Session ID is required'),
  attendanceId: z.string().min(1, 'Attendance ID is required'),
  attendanceEntryId: z.string().min(1, 'Attendance Entry ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  newStatus: AttendanceStatusEnum,
  reason: z.string().min(5, 'Mandatory reason is required (min 5 characters)').max(500),
});

export type CreateAttendanceCorrectionInput = z.infer<typeof CreateAttendanceCorrectionSchema>;

export const ReviewAttendanceCorrectionSchema = z.object({
  correctionStatus: z.enum(['APPROVED', 'REJECTED']),
  reviewerRemarks: z.string().max(300).optional(),
});

export type ReviewAttendanceCorrectionInput = z.infer<typeof ReviewAttendanceCorrectionSchema>;

export const UpsertAttendanceLockRuleSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic Session ID is required'),
  lockAfterHours: z.number().int().min(0).max(720).optional(),
  lockAfterTimeOfDay: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:mm').optional(),
  allowTeacherCorrectionRequest: z.boolean().default(true),
  adminOverrideEnabled: z.boolean().default(true),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export type UpsertAttendanceLockRuleInput = z.infer<typeof UpsertAttendanceLockRuleSchema>;

export const AttendanceRegisterQuerySchema = z.object({
  academicSessionId: z.string().min(1, 'Academic Session ID is required'),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD'),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  studentId: z.string().optional(),
  teacherId: z.string().optional(),
  attendanceType: AttendanceTypeEnum.optional(),
});

export type AttendanceRegisterQueryInput = z.infer<typeof AttendanceRegisterQuerySchema>;

export const AttendanceAnalyticsQuerySchema = z.object({
  academicSessionId: z.string().min(1, 'Academic Session ID is required'),
  startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD').optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  teacherId: z.string().optional(),
});

export type AttendanceAnalyticsQueryInput = z.infer<typeof AttendanceAnalyticsQuerySchema>;
