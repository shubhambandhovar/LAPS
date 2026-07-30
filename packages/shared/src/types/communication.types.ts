import type {
  NotificationPriority,
  NotificationCategory,
  NotificationReadStatus,
  NoticeType,
  NoticeStatus,
  NoticeTargetRole,
  DeliveryChannel,
  DeliveryStatus,
  ScheduledNotificationType,
  ScheduledNotificationStatus,
  ScheduledNotificationTargetType,
  CreateNotificationInput,
  SendDirectNotificationInput,
  SendBulkNotificationInput,
  NotificationFilterInput,
  NoticeAttachmentInput,
  CreateNoticeInput,
  UpdateNoticeInput,
  NoticeFilterInput,
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
  TemplatePreviewInput,
  CategoryPreferenceInput,
  UpdateNotificationPreferenceInput,
  DeliveryLogFilterInput,
  CreateScheduledNotificationInput,
  ScheduledNotificationFilterInput,
} from '../schemas/communication.schema';

export type {
  NotificationPriority,
  NotificationCategory,
  NotificationReadStatus,
  NoticeType,
  NoticeStatus,
  NoticeTargetRole,
  DeliveryChannel,
  DeliveryStatus,
  ScheduledNotificationType,
  ScheduledNotificationStatus,
  ScheduledNotificationTargetType,
  CreateNotificationInput,
  SendDirectNotificationInput,
  SendBulkNotificationInput,
  NotificationFilterInput,
  NoticeAttachmentInput,
  CreateNoticeInput,
  UpdateNoticeInput,
  NoticeFilterInput,
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
  TemplatePreviewInput,
  CategoryPreferenceInput,
  UpdateNotificationPreferenceInput,
  DeliveryLogFilterInput,
  CreateScheduledNotificationInput,
  ScheduledNotificationFilterInput,
};

export interface INotification {
  _id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  category: NotificationCategory;
  senderId?: string;
  recipientId: string;
  readStatus: NotificationReadStatus;
  readAt?: Date;
  isArchived: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INoticeAttachment {
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface INotice {
  _id: string;
  title: string;
  content: string;
  type: NoticeType;
  status: NoticeStatus;
  targetRoles: NoticeTargetRole[];
  targetAcademicSessionId?: string;
  targetClassIds?: string[];
  targetSectionIds?: string[];
  attachments: INoticeAttachment[];
  publishDate?: Date;
  expiryDate?: Date;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationTemplate {
  _id: string;
  code: string;
  name: string;
  category: NotificationCategory;
  channels: DeliveryChannel[];
  subjectTemplate?: string;
  bodyTemplate: string;
  variables: string[];
  locale: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeliveryLog {
  _id: string;
  notificationId?: string;
  noticeId?: string;
  recipientId: string;
  channel: DeliveryChannel;
  status: DeliveryStatus;
  retryCount: number;
  maxRetries: number;
  failureReason?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryPreference {
  inApp: boolean;
  email: boolean;
  sms: boolean;
}

export interface INotificationPreference {
  _id: string;
  userId: string;
  preferences: {
    attendance: ICategoryPreference;
    homework: ICategoryPreference;
    exam: ICategoryPreference;
    result: ICategoryPreference;
    fee: ICategoryPreference;
    general: ICategoryPreference;
    system: ICategoryPreference;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IScheduledNotification {
  _id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  targetType: ScheduledNotificationTargetType;
  targetRoles?: string[];
  targetAcademicSessionId?: string;
  targetClassIds?: string[];
  targetSectionIds?: string[];
  recipientIds?: string[];
  templateId?: string;
  templateVariables?: Record<string, any>;
  scheduleType: ScheduledNotificationType;
  scheduledAt?: Date;
  cronExpression?: string;
  expiryDate?: Date;
  status: ScheduledNotificationStatus;
  totalRecipients: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
