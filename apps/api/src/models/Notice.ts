/**
 * Notice Model — Collection #58
 *
 * School notices, circulars, announcements, and events scoped by audience roles,
 * academic sessions, classes, and sections.
 */

import { Schema, model, Document, Types } from 'mongoose';
import {
  NoticeType,
  NoticeStatus,
  NoticeTargetRole,
} from '@laps/shared';

export interface INoticeAttachment {
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface INotice {
  title: string;
  content: string;
  type: NoticeType;
  status: NoticeStatus;
  targetRoles: NoticeTargetRole[];
  targetAcademicSessionId?: Types.ObjectId;
  targetClassIds?: Types.ObjectId[];
  targetSectionIds?: Types.ObjectId[];
  attachments: INoticeAttachment[];
  publishDate?: Date;
  expiryDate?: Date;
  authorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface INoticeDoc extends INotice, Document {}

const noticeAttachmentSchema = new Schema<INoticeAttachment>(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSizeBytes: { type: Number, required: true },
    mimeType: { type: String, required: true },
  },
  { _id: false }
);

const noticeSchema = new Schema<INoticeDoc>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['SCHOOL_NOTICE', 'CIRCULAR', 'ANNOUNCEMENT', 'EVENT'],
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'],
      default: 'DRAFT',
    },
    targetRoles: [
      {
        type: String,
        enum: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN', 'STAFF', 'ALL'],
      },
    ],
    targetAcademicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: false,
    },
    targetClassIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Class',
      },
    ],
    targetSectionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Section',
      },
    ],
    attachments: {
      type: [noticeAttachmentSchema],
      default: [],
    },
    publishDate: {
      type: Date,
      required: false,
    },
    expiryDate: {
      type: Date,
      required: false,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

noticeSchema.index({ status: 1, publishDate: -1 });
noticeSchema.index({ targetRoles: 1, status: 1, expiryDate: 1 });
noticeSchema.index({ targetAcademicSessionId: 1, targetClassIds: 1 });

export const Notice = model<INoticeDoc>('Notice', noticeSchema);
