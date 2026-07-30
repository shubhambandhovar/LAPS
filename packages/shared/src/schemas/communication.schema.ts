import { z } from 'zod';

// ==========================================
// 1. STATUS & ENUM DEFINITIONS
// ==========================================

export const NotificationPriorityEnum = z.enum([
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
]);
export type NotificationPriority = z.infer<typeof NotificationPriorityEnum>;

export const NotificationCategoryEnum = z.enum([
  'ATTENDANCE',
  'HOMEWORK',
  'EXAM',
  'RESULT',
  'FEE',
  'GENERAL',
  'SYSTEM',
]);
export type NotificationCategory = z.infer<typeof NotificationCategoryEnum>;

export const NotificationReadStatusEnum = z.enum([
  'READ',
  'UNREAD',
]);
export type NotificationReadStatus = z.infer<typeof NotificationReadStatusEnum>;

export const NoticeTypeEnum = z.enum([
  'SCHOOL_NOTICE',
  'CIRCULAR',
  'ANNOUNCEMENT',
  'EVENT',
]);
export type NoticeType = z.infer<typeof NoticeTypeEnum>;

export const NoticeStatusEnum = z.enum([
  'DRAFT',
  'PUBLISHED',
  'EXPIRED',
  'ARCHIVED',
]);
export type NoticeStatus = z.infer<typeof NoticeStatusEnum>;

export const NoticeTargetRoleEnum = z.enum([
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'TEACHER',
  'STUDENT',
  'GUARDIAN',
  'STAFF',
  'ALL',
]);
export type NoticeTargetRole = z.infer<typeof NoticeTargetRoleEnum>;

export const DeliveryChannelEnum = z.enum([
  'IN_APP',
  'EMAIL',
  'SMS',
]);
export type DeliveryChannel = z.infer<typeof DeliveryChannelEnum>;

export const DeliveryStatusEnum = z.enum([
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
]);
export type DeliveryStatus = z.infer<typeof DeliveryStatusEnum>;

export const ScheduledNotificationTypeEnum = z.enum([
  'IMMEDIATE',
  'SCHEDULED',
  'RECURRING',
]);
export type ScheduledNotificationType = z.infer<typeof ScheduledNotificationTypeEnum>;

export const ScheduledNotificationStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'CANCELLED',
  'FAILED',
]);
export type ScheduledNotificationStatus = z.infer<typeof ScheduledNotificationStatusEnum>;

export const ScheduledNotificationTargetTypeEnum = z.enum([
  'ALL',
  'ROLE',
  'CLASS',
  'SECTION',
  'INDIVIDUAL',
]);
export type ScheduledNotificationTargetType = z.infer<typeof ScheduledNotificationTargetTypeEnum>;

// ==========================================
// 2. NOTIFICATION SCHEMAS
// ==========================================

export const CreateNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message cannot exceed 1000 characters'),
  priority: NotificationPriorityEnum.default('NORMAL'),
  category: NotificationCategoryEnum,
  senderId: z.string().optional(),
  recipientId: z.string().min(1, 'Recipient ID is required'),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;

export const SendDirectNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150),
  message: z.string().min(1, 'Message is required').max(1000),
  priority: NotificationPriorityEnum.default('NORMAL'),
  category: NotificationCategoryEnum,
  recipientIds: z.array(z.string().min(1)).min(1, 'At least one recipient is required'),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  channels: z.array(DeliveryChannelEnum).default(['IN_APP', 'EMAIL', 'SMS']),
});
export type SendDirectNotificationInput = z.infer<typeof SendDirectNotificationSchema>;

export const SendBulkNotificationSchema = z.object({
  templateCode: z.string().min(1, 'Template code is required'),
  locale: z.string().default('en'),
  category: NotificationCategoryEnum.optional(),
  priority: NotificationPriorityEnum.default('NORMAL'),
  recipientIds: z.array(z.string()).optional(),
  targetRoles: z.array(NoticeTargetRoleEnum).optional(),
  targetClassIds: z.array(z.string()).optional(),
  targetSectionIds: z.array(z.string()).optional(),
  variables: z.record(z.any()).optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
});
export type SendBulkNotificationInput = z.infer<typeof SendBulkNotificationSchema>;

export const NotificationFilterSchema = z.object({
  readStatus: NotificationReadStatusEnum.optional(),
  category: NotificationCategoryEnum.optional(),
  priority: NotificationPriorityEnum.optional(),
  isArchived: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type NotificationFilterInput = z.infer<typeof NotificationFilterSchema>;

// ==========================================
// 3. NOTICE SCHEMAS
// ==========================================

export const NoticeAttachmentSchema = z.object({
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
  fileSizeBytes: z.number().nonnegative(),
  mimeType: z.string().min(1),
});
export type NoticeAttachmentInput = z.infer<typeof NoticeAttachmentSchema>;

export const CreateNoticeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required'),
  type: NoticeTypeEnum,
  status: NoticeStatusEnum.default('DRAFT'),
  targetRoles: z.array(NoticeTargetRoleEnum).min(1, 'At least one target role is required'),
  targetAcademicSessionId: z.string().optional(),
  targetClassIds: z.array(z.string()).optional(),
  targetSectionIds: z.array(z.string()).optional(),
  attachments: z.array(NoticeAttachmentSchema).optional(),
  publishDate: z.string().optional(),
  expiryDate: z.string().optional(),
});
export type CreateNoticeInput = z.infer<typeof CreateNoticeSchema>;

export const UpdateNoticeSchema = CreateNoticeSchema.partial().extend({
  status: NoticeStatusEnum.optional(),
});
export type UpdateNoticeInput = z.infer<typeof UpdateNoticeSchema>;

export const NoticeFilterSchema = z.object({
  status: NoticeStatusEnum.optional(),
  type: NoticeTypeEnum.optional(),
  targetRole: NoticeTargetRoleEnum.optional(),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type NoticeFilterInput = z.infer<typeof NoticeFilterSchema>;

// ==========================================
// 4. TEMPLATE SCHEMAS
// ==========================================

export const CreateNotificationTemplateSchema = z.object({
  code: z.string().min(1, 'Template code is required').regex(/^[A-Z0-9_]+$/, 'Code must be uppercase alphanumeric with underscores'),
  name: z.string().min(1, 'Name is required'),
  category: NotificationCategoryEnum,
  channels: z.array(DeliveryChannelEnum).min(1, 'At least one delivery channel is required'),
  subjectTemplate: z.string().optional(),
  bodyTemplate: z.string().min(1, 'Body template is required'),
  variables: z.array(z.string()).default([]),
  locale: z.string().default('en'),
  isActive: z.boolean().default(true),
});
export type CreateNotificationTemplateInput = z.infer<typeof CreateNotificationTemplateSchema>;

export const UpdateNotificationTemplateSchema = CreateNotificationTemplateSchema.partial();
export type UpdateNotificationTemplateInput = z.infer<typeof UpdateNotificationTemplateSchema>;

export const TemplatePreviewSchema = z.object({
  variables: z.record(z.any()).default({}),
});
export type TemplatePreviewInput = z.infer<typeof TemplatePreviewSchema>;

// ==========================================
// 5. PREFERENCE SCHEMAS
// ==========================================

export const CategoryPreferenceSchema = z.object({
  inApp: z.boolean().default(true),
  email: z.boolean().default(true),
  sms: z.boolean().default(true),
});
export type CategoryPreferenceInput = z.infer<typeof CategoryPreferenceSchema>;

export const UpdateNotificationPreferenceSchema = z.object({
  attendance: CategoryPreferenceSchema.optional(),
  homework: CategoryPreferenceSchema.optional(),
  exam: CategoryPreferenceSchema.optional(),
  result: CategoryPreferenceSchema.optional(),
  fee: CategoryPreferenceSchema.optional(),
  general: CategoryPreferenceSchema.optional(),
  system: CategoryPreferenceSchema.optional(),
});
export type UpdateNotificationPreferenceInput = z.infer<typeof UpdateNotificationPreferenceSchema>;

// ==========================================
// 6. DELIVERY LOG & SCHEDULED NOTIFICATION SCHEMAS
// ==========================================

export const DeliveryLogFilterSchema = z.object({
  status: DeliveryStatusEnum.optional(),
  channel: DeliveryChannelEnum.optional(),
  recipientId: z.string().optional(),
  notificationId: z.string().optional(),
  noticeId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type DeliveryLogFilterInput = z.infer<typeof DeliveryLogFilterSchema>;

export const CreateScheduledNotificationSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  category: NotificationCategoryEnum,
  priority: NotificationPriorityEnum.default('NORMAL'),
  targetType: ScheduledNotificationTargetTypeEnum,
  targetRoles: z.array(z.string()).optional(),
  targetAcademicSessionId: z.string().optional(),
  targetClassIds: z.array(z.string()).optional(),
  targetSectionIds: z.array(z.string()).optional(),
  recipientIds: z.array(z.string()).optional(),
  templateId: z.string().optional(),
  templateVariables: z.record(z.any()).optional(),
  scheduleType: ScheduledNotificationTypeEnum,
  scheduledAt: z.string().optional(),
  cronExpression: z.string().optional(),
  expiryDate: z.string().optional(),
});
export type CreateScheduledNotificationInput = z.infer<typeof CreateScheduledNotificationSchema>;

export const ScheduledNotificationFilterSchema = z.object({
  status: ScheduledNotificationStatusEnum.optional(),
  scheduleType: ScheduledNotificationTypeEnum.optional(),
  createdBy: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type ScheduledNotificationFilterInput = z.infer<typeof ScheduledNotificationFilterSchema>;
