/**
 * ReceiptVersion Model — Collection #54
 *
 * Immutable historical version snapshot table preserving receipt state across corrections.
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface IReceiptVersion {
  receiptId: Types.ObjectId;
  versionNumber: number;
  generatedAt: Date;
  generatedBy: Types.ObjectId;
  changeReason: string;
  snapshotData: Record<string, unknown>;
  pdfUrl?: string;
  verificationHash?: string;
  qrCodeUrl?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceiptVersionDoc extends IReceiptVersion, Document {}

const receiptVersionSchema = new Schema<IReceiptVersionDoc>(
  {
    receiptId: {
      type: Schema.Types.ObjectId,
      ref: 'Receipt',
      required: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
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
    snapshotData: {
      type: Schema.Types.Mixed,
      required: true,
    },
    pdfUrl: {
      type: String,
    },
    verificationHash: {
      type: String,
    },
    qrCodeUrl: {
      type: String,
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
    collection: 'receipt_versions',
  }
);

receiptVersionSchema.index({ receiptId: 1, versionNumber: 1 }, { unique: true });

export const ReceiptVersion = model<IReceiptVersionDoc>('ReceiptVersion', receiptVersionSchema);
