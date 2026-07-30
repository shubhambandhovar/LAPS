/**
 * Payment Model — Collection #52
 *
 * Immutable transaction ledger for fee payments against student invoices.
 * Payment records are NEVER deleted; erroneous or bounced entries transition to REVERSED.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { PaymentMode, PaymentStatus } from '@laps/shared';

export interface IPaymentAllocation {
  invoiceId: Types.ObjectId;
  amountAllocated: number;
}

export interface IRefundDetails {
  auditReason: string;
  approvedBy: Types.ObjectId;
  refundedAt: Date;
  refundedAmount: number;
}

export interface IReversalDetails {
  auditReason: string;
  approvedBy: Types.ObjectId;
  reversedAt: Date;
}

export interface IPayment {
  paymentTransactionId: string;
  academicSessionId: Types.ObjectId;
  financialYearId?: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  paidByGuardianId?: Types.ObjectId;
  recordedByUserId: Types.ObjectId;
  amountPaid: number;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  paymentDate: Date;
  allocations: IPaymentAllocation[];
  status: PaymentStatus;
  refundDetails?: IRefundDetails;
  reversalDetails?: IReversalDetails;
  remarks?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentDoc extends IPayment, Document {}

const paymentAllocationSchema = new Schema<IPaymentAllocation>(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
    },
    amountAllocated: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const refundDetailsSchema = new Schema<IRefundDetails>(
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
    refundedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    refundedAmount: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const reversalDetailsSchema = new Schema<IReversalDetails>(
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
    reversedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { _id: false }
);

const paymentSchema = new Schema<IPaymentDoc>(
  {
    paymentTransactionId: {
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
    paidByGuardianId: {
      type: Schema.Types.ObjectId,
      ref: 'Guardian',
    },
    recordedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 1,
    },
    paymentMode: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_GATEWAY'],
      required: true,
    },
    referenceNumber: {
      type: String,
      trim: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    allocations: {
      type: [paymentAllocationSchema],
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVERSED', 'COMPLETED', 'PENDING_CLEARANCE', 'BOUNCED', 'REFUNDED'],
      default: 'ACTIVE',
      required: true,
    },
    refundDetails: {
      type: refundDetailsSchema,
    },
    reversalDetails: {
      type: reversalDetailsSchema,
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
    collection: 'payments',
  }
);

paymentSchema.index({ studentId: 1, paymentDate: -1 });
paymentSchema.index({ enrollmentId: 1, status: 1 });

export const Payment = model<IPaymentDoc>('Payment', paymentSchema);
