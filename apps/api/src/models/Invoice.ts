/**
 * Invoice Model — Collection #51
 *
 * 8-state student fee billing invoice with immutable line item snapshots and audit metadata.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { InvoiceStatus, InvoiceLineItemSnapshotInput } from '@laps/shared';

export interface IAppliedDiscount {
  discountId: Types.ObjectId;
  discountName: string;
  amount: number;
  approvedBy?: Types.ObjectId;
}

export interface IWaivedDetails {
  auditReason: string;
  approvedBy: Types.ObjectId;
  waivedAt: Date;
  waivedAmount: number;
}

export interface ICancelledDetails {
  auditReason: string;
  approvedBy: Types.ObjectId;
  cancelledAt: Date;
}

export interface IInvoice {
  invoiceNumber: string;
  academicSessionId: Types.ObjectId;
  financialYearId?: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  classId: Types.ObjectId;
  feeStructureId?: Types.ObjectId;
  installmentNumber: number;
  title: string;
  dueDate: Date;
  lineItems: InvoiceLineItemSnapshotInput[];
  baseTotal: number;
  discountTotal: number;
  lateFeeAmount: number;
  netTotal: number;
  paidAmount: number;
  outstandingAmount: number;
  status: InvoiceStatus;
  appliedDiscounts: IAppliedDiscount[];
  waivedDetails?: IWaivedDetails;
  cancelledDetails?: ICancelledDetails;
  remarks?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IInvoiceDoc extends IInvoice, Document {}

const lineItemSnapshotSchema = new Schema<InvoiceLineItemSnapshotInput>(
  {
    feeHeadId: {
      type: String,
      required: true,
    },
    feeHeadName: {
      type: String,
      required: true,
    },
    feeHeadCode: {
      type: String,
      required: true,
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountName: {
      type: String,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const appliedDiscountSchema = new Schema<IAppliedDiscount>(
  {
    discountId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeDiscount',
      required: true,
    },
    discountName: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { _id: false }
);

const waivedDetailsSchema = new Schema<IWaivedDetails>(
  {
    auditReason: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    waivedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    waivedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const cancelledDetailsSchema = new Schema<ICancelledDetails>(
  {
    auditReason: {
      type: String,
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cancelledAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const invoiceSchema = new Schema<IInvoiceDoc>(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
    feeStructureId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeStructure',
    },
    installmentNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    lineItems: {
      type: [lineItemSnapshotSchema],
      required: true,
    },
    baseTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFeeAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    netTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    outstandingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'GENERATED',
        'ISSUED',
        'PARTIALLY_PAID',
        'PAID',
        'OVERDUE',
        'WAIVED',
        'CANCELLED',
      ],
      default: 'DRAFT',
      required: true,
    },
    appliedDiscounts: {
      type: [appliedDiscountSchema],
      default: [],
    },
    waivedDetails: {
      type: waivedDetailsSchema,
    },
    cancelledDetails: {
      type: cancelledDetailsSchema,
    },
    remarks: {
      type: String,
      trim: true,
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
    collection: 'invoices',
  }
);

invoiceSchema.index({ academicSessionId: 1, enrollmentId: 1, installmentNumber: 1 });
invoiceSchema.index({ studentId: 1, status: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });

export const Invoice = model<IInvoiceDoc>('Invoice', invoiceSchema);
