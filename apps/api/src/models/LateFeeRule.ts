/**
 * LateFeeRule Model — Collection #50
 *
 * Fixed, percentage, and per-day late fee calculation rules with grace period days.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { LateFeeRuleType, LateFeeRuleStatus } from '@laps/shared';

export interface ILateFeeRule {
  name: string;
  ruleType: LateFeeRuleType;
  amountOrPercentage: number;
  gracePeriodDays: number;
  maxLateFeeLimit?: number;
  status: LateFeeRuleStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILateFeeRuleDoc extends ILateFeeRule, Document {}

const lateFeeRuleSchema = new Schema<ILateFeeRuleDoc>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ruleType: {
      type: String,
      enum: ['FIXED', 'PERCENTAGE', 'PER_DAY'],
      required: true,
    },
    amountOrPercentage: {
      type: Number,
      required: true,
      min: 0,
    },
    gracePeriodDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxLateFeeLimit: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
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
    collection: 'late_fee_rules',
  }
);

lateFeeRuleSchema.index({ status: 1 });

export const LateFeeRule = model<ILateFeeRuleDoc>('LateFeeRule', lateFeeRuleSchema);
