/**
 * Homework Model — Collection #30
 *
 * Governs teacher homework assignments. Must never maintain its own schedule or class-subject mapping.
 * Dynamically validates against active AcademicSession, PUBLISHED Timetable slots, TeachingAssignment, and Enrollment.
 */

import { Schema, model, Document, Types } from 'mongoose';
import {
  HomeworkType,
  HomeworkStatus,
  HomeworkAttachment,
} from '@laps/shared';

export interface IHomework {
  academicSessionId: Types.ObjectId;
  teachingAssignmentId: Types.ObjectId;
  classSubjectId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  subjectId: Types.ObjectId;
  teacherId: Types.ObjectId;
  title: string;
  description?: string;
  instructions?: string;
  homeworkType: HomeworkType;
  maxAttempts: number;
  attachments: HomeworkAttachment[];
  assignedDate: Date;
  dueDate: Date;
  scheduledPublishAt?: Date;
  maxMarks?: number;
  status: HomeworkStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IHomeworkDocument extends IHomework, Document {}

const HomeworkAttachmentSchema = new Schema<HomeworkAttachment>(
  {
    type: {
      type: String,
      enum: ['PDF', 'IMAGE', 'VIDEO', 'LINK', 'ZIP', 'DOCUMENT'],
      required: true,
    },
    url: { type: String, required: true },
    title: { type: String, required: false },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true, default: 0 },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, required: false },
  },
  { _id: false }
);

const HomeworkSchema = new Schema<IHomeworkDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    teachingAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TeachingAssignment',
      required: true,
      index: true,
    },
    classSubjectId: {
      type: Schema.Types.ObjectId,
      ref: 'ClassSubject',
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
      index: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: false,
    },
    instructions: {
      type: String,
      required: false,
    },
    homeworkType: {
      type: String,
      enum: ['HOMEWORK', 'ASSIGNMENT', 'PROJECT', 'ACTIVITY', 'READING'],
      default: 'HOMEWORK',
      required: true,
    },
    maxAttempts: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    attachments: {
      type: [HomeworkAttachmentSchema],
      default: [],
    },
    assignedDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    scheduledPublishAt: {
      type: Date,
      required: false,
    },
    maxMarks: {
      type: Number,
      required: false,
      min: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'CLOSED', 'ARCHIVED'],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    archivedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    archivedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound Indexes for fast dashboard and class-section listing queries
HomeworkSchema.index({ classId: 1, sectionId: 1, status: 1, dueDate: 1 });
HomeworkSchema.index({ teacherId: 1, academicSessionId: 1, status: 1 });
HomeworkSchema.index({ teachingAssignmentId: 1, dueDate: -1 });
HomeworkSchema.index({ status: 1, scheduledPublishAt: 1 });

export const Homework = model<IHomeworkDocument>('Homework', HomeworkSchema);
export default Homework;
