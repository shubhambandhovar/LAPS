import type { EntityStatus, StandardAuditFields, PaginationQuery } from './academics';

export type AttendanceType = 'DAILY' | 'PERIOD';
export type AttendanceSessionStatus = 'DRAFT' | 'SUBMITTED' | 'LOCKED' | 'FROZEN';
export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'MEDICAL_LEAVE'
  | 'APPROVED_LEAVE'
  | 'UNAPPROVED_LEAVE'
  | 'EXCUSED';

export type AttendanceSource =
  | 'MANUAL'
  | 'LEAVE'
  | 'SYSTEM'
  | 'IMPORT'
  | 'BIOMETRIC_RESERVED';

export type LeaveType =
  | 'CASUAL'
  | 'MEDICAL'
  | 'EMERGENCY'
  | 'SPORTS'
  | 'OFFICIAL'
  | 'OTHER';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ApplicantType = 'STUDENT' | 'TEACHER';

export interface AttendanceInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  attendanceType: AttendanceType;
  date: string;
  timetablePeriodId?: string;
  subjectId?: string;
  teachingAssignmentId: string;
  sessionStatus: AttendanceSessionStatus;
  markedByUserId: string;
  markedAt: string;
  isLocked: boolean;
  lockedAt?: string;
  lockedByUserId?: string;
  lockReason?: string;
  isFrozen: boolean;
  frozenAt?: string;
  frozenByUserId?: string;
  freezeReason?: string;
  status: EntityStatus;
}

export interface StatusHistoryItem {
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  changedAt: string;
  reason: string;
}

export interface AttendanceEntryInfo extends StandardAuditFields {
  id: string;
  attendanceId: string;
  academicSessionId: string;
  enrollmentId: string;
  studentId: string;
  classId: string;
  sectionId: string;
  studentName: string;
  rollNumber?: string;
  className: string;
  sectionName: string;
  date: string;
  attendanceStatus: AttendanceStatus;
  attendanceSource: AttendanceSource;
  lateMinutes?: number;
  remarks?: string;
  leaveRequestId?: string;
  statusHistory: StatusHistoryItem[];
  status: EntityStatus;
}

export interface LeaveRequestInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  applicantType: ApplicantType;
  studentId?: string;
  enrollmentId?: string;
  teacherId?: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  leaveStatus: LeaveStatus;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewerRemarks?: string;
  status: EntityStatus;
}

export interface AttendanceCorrectionInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  attendanceId: string;
  attendanceEntryId: string;
  studentId: string;
  requestedByUserId: string;
  oldStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
  correctionStatus: CorrectionStatus;
  reviewedByUserId?: string;
  reviewedAt?: string;
  reviewerRemarks?: string;
  status: EntityStatus;
}

export interface AttendanceLockRuleInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  lockAfterHours?: number;
  lockAfterTimeOfDay?: string;
  allowTeacherCorrectionRequest: boolean;
  adminOverrideEnabled: boolean;
  status: EntityStatus;
}

export interface AttendanceQuery extends PaginationQuery {
  academicSessionId?: string;
  classId?: string;
  sectionId?: string;
  attendanceType?: AttendanceType;
  date?: string;
  startDate?: string;
  endDate?: string;
  sessionStatus?: AttendanceSessionStatus;
  isLocked?: boolean;
  isFrozen?: boolean;
  status?: EntityStatus;
}

export interface AttendanceRegisterQuery {
  academicSessionId: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  startDate: string;
  endDate: string;
  classId?: string;
  sectionId?: string;
  subjectId?: string;
  studentId?: string;
  teacherId?: string;
  attendanceType?: AttendanceType;
}

export interface AttendanceRegisterStudentRow {
  studentId: string;
  enrollmentId: string;
  studentName: string;
  rollNumber?: string;
  className: string;
  sectionName: string;
  records: {
    date: string;
    status: AttendanceStatus;
    attendanceSource: AttendanceSource;
    lateMinutes?: number;
    remarks?: string;
  }[];
  summary: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    medicalLeave: number;
    approvedLeave: number;
    percentage: number;
  };
}

export interface AttendanceAnalyticsSummary {
  academicSessionId: string;
  totalStudents: number;
  averageAttendancePercentage: number;
  defaultersCount: number; // Students with < 75% attendance
  defaulters: {
    studentId: string;
    studentName: string;
    className: string;
    sectionName: string;
    percentage: number;
    totalDays: number;
    presentDays: number;
  }[];
  classWiseBreakdown: {
    classId: string;
    className: string;
    sectionId: string;
    sectionName: string;
    percentage: number;
  }[];
}
