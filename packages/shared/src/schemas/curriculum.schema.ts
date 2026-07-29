import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const CreateAcademicTermSchema = z
  .object({
    academicSessionId: z.string().min(1, 'Academic session is required'),
    name: z.string().min(2, 'Term name is required').max(50),
    code: z.string().min(2, 'Code is required').max(20).toUpperCase(),
    startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD'),
    orderSequence: z.number().int().min(1, 'Order sequence must be 1 or greater'),
    status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
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
  );

export type CreateAcademicTermInput = z.infer<typeof CreateAcademicTermSchema>;

export const UpdateAcademicTermSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  code: z.string().min(2).max(20).toUpperCase().optional(),
  startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD').optional(),
  orderSequence: z.number().int().min(1).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateAcademicTermInput = z.infer<typeof UpdateAcademicTermSchema>;

export const CreateClassSubjectSchema = z
  .object({
    academicSessionId: z.string().min(1, 'Academic session is required'),
    classId: z.string().min(1, 'Class is required'),
    subjectId: z.string().min(1, 'Subject is required'),
    isMandatory: z.boolean().default(true),
    isOptional: z.boolean().default(false),
    subjectGroup: z.string().max(30).optional(),
    minPeriodsPerWeek: z.number().int().min(0).max(50).optional(),
    maxPeriodsPerWeek: z.number().int().min(0).max(50).optional(),
    orderSequence: z.number().int().min(0).default(1),
    status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  })
  .refine(
    (data) => {
      if (data.minPeriodsPerWeek !== undefined && data.maxPeriodsPerWeek !== undefined) {
        return data.maxPeriodsPerWeek >= data.minPeriodsPerWeek;
      }
      return true;
    },
    {
      message: 'maxPeriodsPerWeek must be greater than or equal to minPeriodsPerWeek',
      path: ['maxPeriodsPerWeek'],
    }
  );

export type CreateClassSubjectInput = z.infer<typeof CreateClassSubjectSchema>;

export const UpdateClassSubjectSchema = z.object({
  isMandatory: z.boolean().optional(),
  isOptional: z.boolean().optional(),
  subjectGroup: z.string().max(30).optional(),
  minPeriodsPerWeek: z.number().int().min(0).max(50).optional(),
  maxPeriodsPerWeek: z.number().int().min(0).max(50).optional(),
  orderSequence: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateClassSubjectInput = z.infer<typeof UpdateClassSubjectSchema>;

export const CreateRoomSchema = z.object({
  name: z.string().min(2, 'Room name is required').max(50),
  code: z.string().min(2, 'Room code is required').max(20).toUpperCase(),
  capacity: z.number().int().min(1, 'Capacity must be at least 1').max(500).default(40),
  building: z.string().max(50).optional(),
  floor: z.string().max(30).optional(),
  roomType: z.enum(['CLASSROOM', 'LAB', 'AUDITORIUM', 'SPORTS', 'OTHER']).default('CLASSROOM'),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export type CreateRoomInput = z.infer<typeof CreateRoomSchema>;

export const UpdateRoomSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  code: z.string().min(2).max(20).toUpperCase().optional(),
  capacity: z.number().int().min(1).max(500).optional(),
  building: z.string().max(50).optional(),
  floor: z.string().max(30).optional(),
  roomType: z.enum(['CLASSROOM', 'LAB', 'AUDITORIUM', 'SPORTS', 'OTHER']).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateRoomInput = z.infer<typeof UpdateRoomSchema>;

export const CreateBellScheduleSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session is required'),
  name: z.string().min(2, 'Schedule name is required').max(50),
  scheduleType: z.enum(['REGULAR', 'EXAM', 'HALF_DAY', 'SPECIAL_EVENT']).default('REGULAR'),
  scopeType: z.enum(['GLOBAL', 'CLASS']).default('GLOBAL'),
  targetClassIds: z.array(z.string()).optional(),
  validFrom: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  validTo: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  isDefault: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export type CreateBellScheduleInput = z.infer<typeof CreateBellScheduleSchema>;

export const UpdateBellScheduleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  scheduleType: z.enum(['REGULAR', 'EXAM', 'HALF_DAY', 'SPECIAL_EVENT']).optional(),
  scopeType: z.enum(['GLOBAL', 'CLASS']).optional(),
  targetClassIds: z.array(z.string()).optional(),
  validFrom: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  validTo: z.string().regex(dateRegex, 'Date must be YYYY-MM-DD').optional(),
  isDefault: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateBellScheduleInput = z.infer<typeof UpdateBellScheduleSchema>;

export const CreateTimetablePeriodSchema = z
  .object({
    academicSessionId: z.string().min(1, 'Academic session is required'),
    bellScheduleId: z.string().min(1, 'Bell schedule is required'),
    name: z.string().min(1, 'Period name is required').max(30),
    sequence: z.number().int().min(1, 'Sequence must be positive integer'),
    startTime: z.string().regex(timeRegex, 'Start time must be HH:MM (24-hr)'),
    endTime: z.string().regex(timeRegex, 'End time must be HH:MM (24-hr)'),
    isBreak: z.boolean().default(false),
    status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  })
  .refine(
    (data) => {
      const [sh, sm] = data.startTime.split(':').map(Number);
      const [eh, em] = data.endTime.split(':').map(Number);
      return eh * 60 + em > sh * 60 + sm;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

export type CreateTimetablePeriodInput = z.infer<typeof CreateTimetablePeriodSchema>;

export const UpdateTimetablePeriodSchema = z.object({
  name: z.string().min(1).max(30).optional(),
  sequence: z.number().int().min(1).optional(),
  startTime: z.string().regex(timeRegex, 'Start time must be HH:MM (24-hr)').optional(),
  endTime: z.string().regex(timeRegex, 'End time must be HH:MM (24-hr)').optional(),
  isBreak: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateTimetablePeriodInput = z.infer<typeof UpdateTimetablePeriodSchema>;

export const CreateTimetableSlotSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session is required'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  dayOfWeek: z.enum([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ]),
  timetablePeriodId: z.string().min(1, 'Period is required'),
  classSubjectId: z.string().min(1, 'Class-Subject mapping is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  teachingAssignmentId: z.string().min(1, 'Teaching assignment is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  roomId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
});

export type CreateTimetableSlotInput = z.infer<typeof CreateTimetableSlotSchema>;

export const UpdateTimetableSlotSchema = z.object({
  classSubjectId: z.string().optional(),
  subjectId: z.string().optional(),
  teachingAssignmentId: z.string().optional(),
  teacherId: z.string().optional(),
  roomId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export type UpdateTimetableSlotInput = z.infer<typeof UpdateTimetableSlotSchema>;

export const PublishTimetableSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session is required'),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  slotIds: z.array(z.string()).optional(),
});

export type PublishTimetableInput = z.infer<typeof PublishTimetableSchema>;

export const RecurrenceRuleSchema = z.object({
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  interval: z.number().int().min(1).default(1).optional(),
  count: z.number().int().min(1).max(365).optional(),
  untilDate: z.string().regex(dateRegex, 'Until date must be YYYY-MM-DD').optional(),
});

export type RecurrenceRuleInput = z.infer<typeof RecurrenceRuleSchema>;

export const CreateCalendarEventSchema = z
  .object({
    academicSessionId: z.string().min(1, 'Academic session is required'),
    title: z.string().min(2, 'Title is required').max(100),
    eventType: z.enum([
      'WORKING_DAY',
      'HOLIDAY',
      'HALF_DAY',
      'EXAM_BLOCK',
      'VACATION',
      'SPECIAL_EVENT',
      'EMERGENCY_CLOSURE',
    ]),
    startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD'),
    isWorkingDay: z.boolean().default(false),
    isRecurring: z.boolean().default(false),
    recurrenceRule: RecurrenceRuleSchema.optional(),
    appliesToAllClasses: z.boolean().default(true),
    targetClassIds: z.array(z.string()).optional(),
    description: z.string().max(500).optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
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
  );

export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>;

export const UpdateCalendarEventSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  eventType: z.enum([
    'WORKING_DAY',
    'HOLIDAY',
    'HALF_DAY',
    'EXAM_BLOCK',
    'VACATION',
    'SPECIAL_EVENT',
    'EMERGENCY_CLOSURE',
  ]).optional(),
  startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD').optional(),
  isWorkingDay: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: RecurrenceRuleSchema.optional(),
  appliesToAllClasses: z.boolean().optional(),
  targetClassIds: z.array(z.string()).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateCalendarEventInput = z.infer<typeof UpdateCalendarEventSchema>;

export const UpsertWorkingDayRuleSchema = z.object({
  academicSessionId: z.string().min(1, 'Academic session is required'),
  workingDaysPattern: z.enum(['MON_TO_FRI', 'MON_TO_SAT', 'CUSTOM']).default('MON_TO_SAT'),
  customWorkingDays: z
    .array(
      z.enum([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ])
    )
    .optional(),
  halfDaysOfWeek: z
    .array(
      z.enum([
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ])
    )
    .optional(),
  emergencyClosureActive: z.boolean().default(false),
  emergencyClosureReason: z.string().max(300).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export type UpsertWorkingDayRuleInput = z.infer<typeof UpsertWorkingDayRuleSchema>;

export const CreateHolidaySchema = z
  .object({
    academicSessionId: z.string().min(1, 'Academic session is required'),
    title: z.string().min(2, 'Title is required').max(100),
    holidayType: z.enum(['NATIONAL', 'STATE', 'SCHOOL', 'OPTIONAL', 'EMERGENCY_CLOSURE']),
    startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD'),
    endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD'),
    isOptionalHoliday: z.boolean().default(false),
    affectsAttendance: z.boolean().default(true),
    description: z.string().max(500).optional(),
    status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
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
  );

export type CreateHolidayInput = z.infer<typeof CreateHolidaySchema>;

export const UpdateHolidaySchema = z.object({
  title: z.string().min(2).max(100).optional(),
  holidayType: z.enum(['NATIONAL', 'STATE', 'SCHOOL', 'OPTIONAL', 'EMERGENCY_CLOSURE']).optional(),
  startDate: z.string().regex(dateRegex, 'Start date must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(dateRegex, 'End date must be YYYY-MM-DD').optional(),
  isOptionalHoliday: z.boolean().optional(),
  affectsAttendance: z.boolean().optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateHolidayInput = z.infer<typeof UpdateHolidaySchema>;
