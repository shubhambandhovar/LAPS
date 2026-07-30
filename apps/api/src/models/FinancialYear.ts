/**
 * FinancialYear Model — Collection #46
 *
 * Master reference for fiscal accounting years without changing the current Academic Session dependency.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { FinancialYearStatus } from '@laps/shared';

export interface IFinancialYear {
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: FinancialYearStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFinancialYearDoc extends IFinancialYear, Document {}

const financialYearSchema = new Schema<IFinancialYearDoc>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CLOSED', 'ARCHIVED'],
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
    collection: 'financial_years',
  }
);

financialYearSchema.index({ status: 1 });

export const FinancialYear = model<IFinancialYearDoc>('FinancialYear', financialYearSchema);
