/**
 * AttendanceEntry Model — Collection #26
 *
 * Individual student attendance record within an Attendance session.
 * Stores historical snapshot fields (studentName, rollNumber, className, sectionName)
 * for register fidelity, tracks attendanceSource and lateMinutes for punctuality,
 * and maintains an immutable statusHistory audit trail.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { AttendanceStatus, AttendanceSource, EntityStatus, StatusHistoryItem } from '@laps/shared';

export interface IAttendanceEntry {
  attendanceId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  studentName: string;
  rollNumber?: string;
  className: string;
  sectionName: string;
  date: string;
  attendanceStatus: AttendanceStatus;
  attendanceSource: AttendanceSource;
  lateMinutes?: number;
  remarks?: string;
  leaveRequestId?: Types.ObjectId;
  statusHistory: StatusHistoryItem[];
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceEntryDocument extends IAttendanceEntry, Document {}

const StatusHistoryItemSchema = new Schema(
  {
    oldStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const AttendanceEntrySchema = new Schema<IAttendanceEntryDocument>(
  {
    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
      index: true,
    },
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Section',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    rollNumber: {
      type: String,
      required: false,
    },
    className: {
      type: String,
      required: true,
    },
    sectionName: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    attendanceStatus: {
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
      default: 'PRESENT',
      required: true,
    },
    attendanceSource: {
      type: String,
      enum: ['MANUAL', 'LEAVE', 'SYSTEM', 'IMPORT', 'BIOMETRIC_RESERVED'],
      default: 'MANUAL',
      required: true,
    },
    lateMinutes: {
      type: Number,
      default: 0,
      required: false,
    },
    remarks: {
      type: String,
      maxlength: 200,
      required: false,
    },
    leaveRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'LeaveRequest',
      required: false,
    },
    statusHistory: {
      type: [StatusHistoryItemSchema],
      default: [],
      required: true,
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
    collection: 'attendance_entries',
  }
);

AttendanceEntrySchema.index({ attendanceId: 1, studentId: 1 }, { unique: true });
AttendanceEntrySchema.index({ academicSessionId: 1, studentId: 1, date: 1 });
AttendanceEntrySchema.index({ classId: 1, sectionId: 1, date: 1, attendanceStatus: 1 });
AttendanceEntrySchema.index({ attendanceSource: 1 });

export const AttendanceEntry = model<IAttendanceEntryDocument>('AttendanceEntry', AttendanceEntrySchema);
export default AttendanceEntry;
