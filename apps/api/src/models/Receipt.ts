/**
 * Receipt Model — Collection #53
 *
 * Printable PDF receipt generated for each completed payment transaction.
 * Reserves verificationHash and qrCodeUrl for digital cryptographic verification.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { ReceiptStatus } from '@laps/shared';

export interface IReceiptVersionSummaryItem {
  versionNumber: number;
  generatedAt: Date;
  generatedBy: Types.ObjectId;
  changeReason: string;
  pdfUrl?: string;
}

export interface IReceipt {
  receiptNumber: string;
  paymentId: Types.ObjectId;
  invoiceIds: Types.ObjectId[];
  enrollmentId: Types.ObjectId;
  studentId: Types.ObjectId;
  issuedDate: Date;
  totalAmount: number;
  paymentMode: string;
  pdfUrl?: string;
  verificationHash?: string;
  qrCodeUrl?: string;
  versionNumber: number;
  versionHistory: IReceiptVersionSummaryItem[];
  status: ReceiptStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceiptDoc extends IReceipt, Document {}

const receiptVersionSummaryItemSchema = new Schema<IReceiptVersionSummaryItem>(
  {
    versionNumber: {
      type: Number,
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changeReason: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
    },
  },
  { _id: false }
);

const receiptSchema = new Schema<IReceiptDoc>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
      unique: true,
    },
    invoiceIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Invoice',
      },
    ],
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
    issuedDate: {
      type: Date,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
    },
    verificationHash: {
      type: String,
      trim: true,
    },
    qrCodeUrl: {
      type: String,
      trim: true,
    },
    versionNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
    versionHistory: {
      type: [receiptVersionSummaryItemSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CANCELLED'],
      default: 'ACTIVE',
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
    collection: 'receipts',
  }
);

receiptSchema.index({ studentId: 1, issuedDate: -1 });

export const Receipt = model<IReceiptDoc>('Receipt', receiptSchema);
