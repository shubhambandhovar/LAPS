/**
 * FinancialSummary Model — Collection #56
 *
 * Materialized summary cache for high-performance dashboard analytics and reporting.
 */

import { Schema, model, Document, Types } from 'mongoose';

export interface ICollectionByMode {
  cash: number;
  upi: number;
  card: number;
  bankTransfer: number;
  cheque: number;
  onlineGateway: number;
}

export interface IFinancialSummary {
  academicSessionId: Types.ObjectId;
  financialYearId?: Types.ObjectId;
  classId?: Types.ObjectId | null;
  totalInvoiced: number;
  totalCollected: number;
  totalWaived: number;
  totalOutstanding: number;
  defaultersCount: number;
  collectionByMode: ICollectionByMode;
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFinancialSummaryDoc extends IFinancialSummary, Document {}

const collectionByModeSchema = new Schema<ICollectionByMode>(
  {
    cash: { type: Number, default: 0, min: 0 },
    upi: { type: Number, default: 0, min: 0 },
    card: { type: Number, default: 0, min: 0 },
    bankTransfer: { type: Number, default: 0, min: 0 },
    cheque: { type: Number, default: 0, min: 0 },
    onlineGateway: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const financialSummarySchema = new Schema<IFinancialSummaryDoc>(
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
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      default: null,
    },
    totalInvoiced: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalWaived: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalOutstanding: {
      type: Number,
      default: 0,
    },
    defaultersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    collectionByMode: {
      type: collectionByModeSchema,
      default: () => ({
        cash: 0,
        upi: 0,
        card: 0,
        bankTransfer: 0,
        cheque: 0,
        onlineGateway: 0,
      }),
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'financial_summaries',
  }
);

financialSummarySchema.index({ academicSessionId: 1, classId: 1 });
financialSummarySchema.index({ lastCalculatedAt: 1 });

export const FinancialSummary = model<IFinancialSummaryDoc>(
  'FinancialSummary',
  financialSummarySchema
);
