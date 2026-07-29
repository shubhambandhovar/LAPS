/**
 * AttendanceCorrection Model — Collection #28
 *
 * Formal correction request submitted by a Teacher or Admin to modify an attendance entry
 * after an attendance session has been locked or submitted. Requires a mandatory reason
 * and Admin approval. Once approved, records an immutable audit item in AttendanceEntry.statusHistory.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { AttendanceStatus, CorrectionStatus, EntityStatus } from '@laps/shared';

export interface IAttendanceCorrection {
  academicSessionId: Types.ObjectId;
  attendanceId: Types.ObjectId;
  attendanceEntryId: Types.ObjectId;
  studentId: Types.ObjectId;
  requestedByUserId: Types.ObjectId;
  oldStatus: AttendanceStatus;
  newStatus: AttendanceStatus;
  reason: string;
  correctionStatus: CorrectionStatus;
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

export interface IAttendanceCorrectionDocument extends IAttendanceCorrection, Document {}

const AttendanceCorrectionSchema = new Schema<IAttendanceCorrectionDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
      index: true,
    },
    attendanceEntryId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceEntry',
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    requestedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    oldStatus: {
      type: String,
      enum: [
        'PRESENT',
        'ABSENT',
        'LATE',
        'HALF_DAY',
        'MEDICAL_LEAVE',
        'APPROVED_LEAVE',
        'UNAPPROVED_LEAVE',
        'EXCUSED',
      ],
      required: true,
    },
    newStatus: {
      type: String,
      enum: [
        'PRESENT',
        'ABSENT',
        'LATE',
        'HALF_DAY',
        'MEDICAL_LEAVE',
        'APPROVED_LEAVE',
        'UNAPPROVED_LEAVE',
        'EXCUSED',
      ],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 500,
    },
    correctionStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
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
    collection: 'attendance_corrections',
  }
);

AttendanceCorrectionSchema.index({ academicSessionId: 1, attendanceId: 1, studentId: 1 });

export const AttendanceCorrection = model<IAttendanceCorrectionDocument>(
  'AttendanceCorrection',
  AttendanceCorrectionSchema
);
export default AttendanceCorrection;
