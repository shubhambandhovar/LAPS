import { z } from 'zod';

export const EventTypeEnum = z.enum(['ACADEMIC', 'SPORTS', 'CULTURAL', 'PTM', 'MEETING', 'SEMINAR', 'COMPETITION', 'WORKSHOP', 'EXAM', 'FEE', 'CUSTOM']);
export const EventVisibilityEnum = z.enum(['SCHOOL_WIDE', 'TEACHERS_ONLY', 'CLASS_SPECIFIC']);
export const CalendarEventCategoryEnum = z.enum(['HOLIDAY', 'EVENT', 'EXAM', 'HOMEWORK', 'ATTENDANCE', 'FEE']);
export const EventPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH']);
export const ReminderChannelEnum = z.enum(['IN_APP', 'EMAIL', 'SMS']);
export const ReminderStatusEnum = z.enum(['PENDING', 'SENT', 'FAILED']);

// SchoolEvent Schema
export const SchoolEventSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, 'Event name is required'),
  eventType: EventTypeEnum,
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isAllDay: z.boolean().default(false),
  description: z.string().optional(),
  location: z.string().optional(),
  visibility: EventVisibilityEnum,
  targetClassIds: z.array(z.string()).optional(),
  targetSectionIds: z.array(z.string()).optional(),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  createdBy: z.string().min(1, 'Creator user ID is required'),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const CreateSchoolEventSchema = SchoolEventSchema.omit({ _id: true, createdBy: true, createdAt: true, updatedAt: true });
export const UpdateSchoolEventSchema = CreateSchoolEventSchema.partial();

// CalendarEvent Schema
export const CalendarEventSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  category: CalendarEventCategoryEnum,
  priority: EventPriorityEnum.default('NORMAL'),
  colorHex: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isAllDay: z.boolean().default(false),
  referenceModule: z.enum(['Holiday', 'SchoolEvent', 'Exam', 'Homework', 'Payment']).optional(),
  referenceId: z.string().optional(),
  targetRoles: z.array(z.string()).optional(),
  targetClassIds: z.array(z.string()).optional(),
  targetSectionIds: z.array(z.string()).optional(),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

// AcademicCalendarSummary Schema
export const AcademicCalendarSummarySchema = z.object({
  _id: z.string().optional(),
  academicSessionId: z.string().min(1, 'Academic session ID is required'),
  termId: z.string().optional(),
  totalDays: z.number().int().nonnegative().default(0),
  workingDays: z.number().int().nonnegative().default(0),
  holidayCount: z.number().int().nonnegative().default(0),
  teachingDays: z.number().int().nonnegative().default(0),
  examinationDays: z.number().int().nonnegative().default(0),
  updatedAt: z.string().or(z.date()).optional(),
});

// EventReminder Schema
export const EventReminderSchema = z.object({
  _id: z.string().optional(),
  calendarEventId: z.string().min(1, 'Calendar event ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  reminderTime: z.string().or(z.date()),
  channels: z.array(ReminderChannelEnum),
  status: ReminderStatusEnum.default('PENDING'),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
});

export const CreateEventReminderSchema = EventReminderSchema.omit({ _id: true, userId: true, status: true, createdAt: true, updatedAt: true });
export const UpdateEventReminderSchema = CreateEventReminderSchema.partial();

// TypeScript Types
export type ISchoolEvent = z.infer<typeof SchoolEventSchema>;
export type ICreateSchoolEvent = z.infer<typeof CreateSchoolEventSchema>;
export type IUpdateSchoolEvent = z.infer<typeof UpdateSchoolEventSchema>;

export type ICalendarEvent = z.infer<typeof CalendarEventSchema>;

export type IAcademicCalendarSummary = z.infer<typeof AcademicCalendarSummarySchema>;

export type IEventReminder = z.infer<typeof EventReminderSchema>;
export type ICreateEventReminder = z.infer<typeof CreateEventReminderSchema>;
export type IUpdateEventReminder = z.infer<typeof UpdateEventReminderSchema>;
