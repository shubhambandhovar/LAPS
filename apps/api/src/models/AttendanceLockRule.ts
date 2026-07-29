/**
 * AttendanceLockRule Model — Collection #29
 *
 * Configurable attendance lock rules per academic session.
 * Specifies auto-lock cutoff after hours or time of day, whether teachers can request corrections,
 * and admin override settings.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { EntityStatus } from '@laps/shared';

export interface IAttendanceLockRule {
  academicSessionId: Types.ObjectId;
  lockAfterHours?: number;
  lockAfterTimeOfDay?: string;
  allowTeacherCorrectionRequest: boolean;
  adminOverrideEnabled: boolean;
  status: EntityStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttendanceLockRuleDocument extends IAttendanceLockRule, Document {}

const AttendanceLockRuleSchema = new Schema<IAttendanceLockRuleDocument>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      unique: true,
      index: true,
    },
    lockAfterHours: {
      type: Number,
      min: 0,
      max: 720,
      required: false,
    },
    lockAfterTimeOfDay: {
      type: String,
      match: /^([01]\d|2[0-3]):([0-5]\d)$/,
      required: false,
    },
    allowTeacherCorrectionRequest: {
      type: Boolean,
      default: true,
      required: true,
    },
    adminOverrideEnabled: {
      type: Boolean,
      default: true,
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
    collection: 'attendance_lock_rules',
  }
);

export const AttendanceLockRule = model<IAttendanceLockRuleDocument>(
  'AttendanceLockRule',
  AttendanceLockRuleSchema
);
export default AttendanceLockRule;
