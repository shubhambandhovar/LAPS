/**
 * Attendance Model — Collection #25
 *
 * Represents the attendance marking session for a class/section on a specific date
 * (either DAILY for class teacher or PERIOD for subject teacher).
 *
 * Future Analytics Materialized Summary Strategy (Planning Note):
 * For large-scale multi-year reporting, daily attendance entries are aggregated nightly
 * (or upon session lock) into a materialized summary collection/cache keyed by
 * (academicSessionId, studentId, month, year). This avoids scanning millions of
 * AttendanceEntry rows for session-wide attendance percentage calculations and
 * defaulter detection (< 75%).
 */

import { Schema, model, Document, Types } from 'mongoose';
import { AttendanceType, AttendanceSessionStatus, EntityStatus } from '@laps/shared';

export interface IAttendance {
  academicSessionId: Types.ObjectId;
  classId: Types.ObjectId;
  sectionId: Types.ObjectId;
  attendanceType: AttendanceType;
  date: string;
  timetablePeriodId?: Types.ObjectId;
  subjectId?: Types.ObjectId;
  teachingAssignmentId: Types.ObjectId;
  sessionStatus: AttendanceSessionStatus;
  markedByUserId: Types.ObjectId;
  markedAt: Date;
  isLocked: boolean;
  lockedAt?: Date;
  lockedByUserId?: Types.ObjectId;
  lockReason?: string;
  isFrozen: boolean;
  frozenAt?: Date;
  frozenByUserId?: Types.ObjectId;
  freezeReason?: string;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceDocument extends IAttendance, Document {}

const AttendanceSchema = new Schema<IAttendanceDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
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
    attendanceType: {
      type: String,
      enum: ['DAILY', 'PERIOD'],
      default: 'DAILY',
      required: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    timetablePeriodId: {
      type: Schema.Types.ObjectId,
      ref: 'TimetablePeriod',
      required: false,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: false,
    },
    teachingAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'TeachingAssignment',
      required: true,
    },
    sessionStatus: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'LOCKED', 'FROZEN'],
      default: 'DRAFT',
      required: true,
    },
    markedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
      required: true,
    },
    lockedAt: {
      type: Date,
      required: false,
    },
    lockedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    lockReason: {
      type: String,
      required: false,
    },
    isFrozen: {
      type: Boolean,
      default: false,
      required: true,
    },
    frozenAt: {
      type: Date,
      required: false,
    },
    frozenByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    freezeReason: {
      type: String,
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
    collection: 'attendances',
  }
);

AttendanceSchema.index(
  {
    academicSessionId: 1,
    classId: 1,
    sectionId: 1,
    date: 1,
    attendanceType: 1,
    timetablePeriodId: 1,
  },
  { unique: true }
);

AttendanceSchema.index({ teachingAssignmentId: 1, date: 1 });
AttendanceSchema.index({ status: 1, sessionStatus: 1, isLocked: 1, isFrozen: 1 });

export const Attendance = model<IAttendanceDocument>('Attendance', AttendanceSchema);
export default Attendance;
