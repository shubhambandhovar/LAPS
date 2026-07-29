import type { EntityStatus, StandardAuditFields, PaginationQuery } from './academics';

export type RoomType = 'CLASSROOM' | 'LAB' | 'AUDITORIUM' | 'SPORTS' | 'OTHER';
export type BellScheduleType = 'REGULAR' | 'EXAM' | 'HALF_DAY' | 'SPECIAL_EVENT';
export type BellScheduleScopeType = 'GLOBAL' | 'CLASS';
export type TimetableStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type DayOfWeek =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export type AcademicEventType =
  | 'WORKING_DAY'
  | 'HOLIDAY'
  | 'HALF_DAY'
  | 'EXAM_BLOCK'
  | 'VACATION'
  | 'SPECIAL_EVENT'
  | 'EMERGENCY_CLOSURE';

export type RecurrenceFrequency = 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type WorkingDaysPattern = 'MON_TO_FRI' | 'MON_TO_SAT' | 'CUSTOM';
export type HolidayType =
  | 'NATIONAL'
  | 'STATE'
  | 'SCHOOL'
  | 'OPTIONAL'
  | 'EMERGENCY_CLOSURE';

export interface AcademicTermInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  orderSequence: number;
  status: EntityStatus;
  sessionName?: string;
}

export interface ClassSubjectInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  classId: string;
  subjectId: string;
  isMandatory: boolean;
  isOptional: boolean;
  subjectGroup?: string;
  minPeriodsPerWeek?: number;
  maxPeriodsPerWeek?: number;
  orderSequence: number;
  status: EntityStatus;
  className?: string;
  classCode?: string;
  subjectName?: string;
  subjectCode?: string;
  subjectType?: string;
}

export interface RoomInfo extends StandardAuditFields {
  id: string;
  name: string;
  code: string;
  capacity: number;
  building?: string;
  floor?: string;
  roomType: RoomType;
  status: EntityStatus;
}

export interface BellScheduleInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  name: string;
  scheduleType: BellScheduleType;
  scopeType: BellScheduleScopeType;
  targetClassIds?: string[];
  validFrom?: string;
  validTo?: string;
  isDefault: boolean;
  status: EntityStatus;
  sessionName?: string;
  targetClassNames?: string[];
}

export interface TimetablePeriodInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  bellScheduleId: string;
  name: string;
  sequence: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  status: EntityStatus;
  bellScheduleName?: string;
}

export interface TimetableSlotInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  classId: string;
  sectionId: string;
  dayOfWeek: DayOfWeek;
  timetablePeriodId: string;
  classSubjectId: string;
  subjectId: string;
  teachingAssignmentId: string;
  teacherId: string;
  roomId?: string;
  status: TimetableStatus;
  className?: string;
  sectionName?: string;
  periodName?: string;
  periodStartTime?: string;
  periodEndTime?: string;
  subjectName?: string;
  subjectCode?: string;
  teacherName?: string;
  roomName?: string;
  roomCode?: string;
}

export interface TeacherWorkloadMetrics {
  teacherId: string;
  teacherName: string;
  academicSessionId: string;
  periodsPerDay: Record<DayOfWeek, number>;
  totalPeriodsPerWeek: number;
  freePeriodsPerWeek: number;
  maxWeeklyPeriodsThreshold: number;
  isOverloaded: boolean;
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number;
  count?: number;
  untilDate?: string;
}

export interface AcademicCalendarEventInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  title: string;
  eventType: AcademicEventType;
  startDate: string;
  endDate: string;
  isWorkingDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  appliesToAllClasses: boolean;
  targetClassIds?: string[];
  description?: string;
  status: EntityStatus;
  sessionName?: string;
  targetClassNames?: string[];
}

export interface WorkingDayRuleInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  workingDaysPattern: WorkingDaysPattern;
  customWorkingDays?: DayOfWeek[];
  halfDaysOfWeek?: DayOfWeek[];
  emergencyClosureActive: boolean;
  emergencyClosureReason?: string;
  status: EntityStatus;
  sessionName?: string;
}

export interface HolidayInfo extends StandardAuditFields {
  id: string;
  academicSessionId: string;
  title: string;
  holidayType: HolidayType;
  startDate: string;
  endDate: string;
  isOptionalHoliday: boolean;
  affectsAttendance: boolean;
  description?: string;
  status: EntityStatus;
  sessionName?: string;
}

export interface AcademicTermQuery extends PaginationQuery {
  academicSessionId?: string;
  status?: EntityStatus;
}

export interface ClassSubjectQuery extends PaginationQuery {
  academicSessionId?: string;
  classId?: string;
  subjectId?: string;
  isMandatory?: boolean;
  isOptional?: boolean;
  subjectGroup?: string;
  status?: EntityStatus;
}

export interface RoomQuery extends PaginationQuery {
  roomType?: RoomType;
  building?: string;
  status?: EntityStatus;
}

export interface BellScheduleQuery extends PaginationQuery {
  academicSessionId?: string;
  scheduleType?: BellScheduleType;
  scopeType?: BellScheduleScopeType;
  targetClassId?: string;
  isDefault?: boolean;
  status?: EntityStatus;
}

export interface TimetablePeriodQuery extends PaginationQuery {
  academicSessionId?: string;
  bellScheduleId?: string;
  isBreak?: boolean;
  status?: EntityStatus;
}

export interface TimetableQuery extends PaginationQuery {
  academicSessionId?: string;
  classId?: string;
  sectionId?: string;
  teacherId?: string;
  roomId?: string;
  dayOfWeek?: DayOfWeek;
  status?: TimetableStatus;
}

export interface AcademicCalendarQuery extends PaginationQuery {
  academicSessionId?: string;
  eventType?: AcademicEventType;
  startDate?: string;
  endDate?: string;
  isWorkingDay?: boolean;
  targetClassId?: string;
  status?: EntityStatus;
}

export interface HolidayQuery extends PaginationQuery {
  academicSessionId?: string;
  holidayType?: HolidayType;
  startDate?: string;
  endDate?: string;
  isOptionalHoliday?: boolean;
  affectsAttendance?: boolean;
  status?: EntityStatus;
}
