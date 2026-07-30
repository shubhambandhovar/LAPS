/**
 * StudentFeeLedger Model — Collection #55
 *
 * Chronological double-entry financial accounting ledger per student enrollment.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { LedgerEntryType } from '@laps/shared';

export interface ILedgerEntry {
  entryId: string;
  date: Date;
  entryType: LedgerEntryType;
  referenceId: Types.ObjectId;
  referenceNumber: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

export interface IStudentFeeLedger {
  academicSessionId: Types.ObjectId;
  financialYearId?: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  totalInvoiced: number;
  totalPaid: number;
  totalWaived: number;
  totalRefunded: number;
  advanceBalance: number;
  outstandingBalance: number;
  ledgerEntries: ILedgerEntry[];
  lastUpdatedAt: Date;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentFeeLedgerDoc extends IStudentFeeLedger, Document {}

const ledgerEntrySchema = new Schema<ILedgerEntry>(
  {
    entryId: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    entryType: {
      type: String,
      enum: ['INVOICE', 'PAYMENT', 'WAIVER', 'ADJUSTMENT', 'REFUND'],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    referenceNumber: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    debit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    credit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    runningBalance: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const studentFeeLedgerSchema = new Schema<IStudentFeeLedgerDoc>(
  {
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
    },
    financialYearId: {
      type: Schema.Types.ObjectId,
      ref: 'FinancialYear',
    },
    enrollmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
      unique: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    totalInvoiced: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWaived: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalRefunded: {
      type: Number,
      default: 0,
      min: 0,
    },
    advanceBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingBalance: {
      type: Number,
      default: 0,
    },
    ledgerEntries: {
      type: [ledgerEntrySchema],
      default: [],
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
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
  },
  {
    timestamps: true,
    collection: 'student_fee_ledgers',
  }
);

studentFeeLedgerSchema.index({ academicSessionId: 1, enrollmentId: 1 }, { unique: true });
studentFeeLedgerSchema.index({ studentId: 1 });
studentFeeLedgerSchema.index({ outstandingBalance: -1 });

export const StudentFeeLedger = model<IStudentFeeLedgerDoc>(
  'StudentFeeLedger',
  studentFeeLedgerSchema
);
