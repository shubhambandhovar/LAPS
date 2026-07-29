/**
 * LeaveRequest Model — Collection #27
 *
 * Formal leave application for either a Student or a Teacher.
 * Uses controlled leaveType enum (CASUAL, MEDICAL, EMERGENCY, SPORTS, OFFICIAL, OTHER).
 * When an approved student leave overlaps with an attendance session, the entry is automatically
 * linked with attendanceSource: "LEAVE".
 */

import { Schema, model, Document, Types } from 'mongoose';
import { LeaveType, LeaveStatus, ApplicantType, EntityStatus } from '@laps/shared';

export interface ILeaveRequest {
  academicSessionId: Types.ObjectId;
  applicantType: ApplicantType;
  studentId?: Types.ObjectId;
  enrollmentId?: Types.ObjectId;
  teacherId?: Types.ObjectId;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  leaveStatus: LeaveStatus;
  reviewedByUserId?: Types.ObjectId;
  reviewedAt?: Date;
  reviewerRemarks?: string;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaveRequestDocument extends ILeaveRequest, Document {}

const LeaveRequestSchema = new Schema<ILeaveRequestDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    applicantType: {
      type: String,
      enum: ['STUDENT', 'TEACHER'],
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: false,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: false,
    },
    teacherId: {
      type: Schema.Types.ObjectId,
      ref: 'Teacher',
      required: false,
    },
    leaveType: {
      type: String,
      enum: ['CASUAL', 'MEDICAL', 'EMERGENCY', 'SPORTS', 'OFFICIAL', 'OTHER'],
      required: true,
    },
    startDate: {
      type: String,
      required: true,
      index: true,
    },
    endDate: {
      type: String,
      required: true,
      index: true,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 0.5,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    attachmentUrl: {
      type: String,
      required: false,
    },
    leaveStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    reviewedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    reviewedAt: {
      type: Date,
      required: false,
    },
    reviewerRemarks: {
      type: String,
      maxlength: 300,
      required: false,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      required: true,
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
    collection: 'leave_requests',
  }
);

LeaveRequestSchema.index({ academicSessionId: 1, studentId: 1, startDate: 1, endDate: 1 });
LeaveRequestSchema.index({ academicSessionId: 1, teacherId: 1, startDate: 1, endDate: 1 });

export const LeaveRequest = model<ILeaveRequestDocument>('LeaveRequest', LeaveRequestSchema);
export default LeaveRequest;
