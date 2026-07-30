/**
 * FeeDiscount Model — Collection #49
 *
 * Concession and scholarship rules with approval workflow flags.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { DiscountType, DiscountCategory, DiscountStatus } from '@laps/shared';

export interface IFeeDiscount {
  name: string;
  code: string;
  discountType: DiscountType;
  value: number;
  category: DiscountCategory;
  requiresApproval: boolean;
  applicableFeeHeadIds: Types.ObjectId[];
  status: DiscountStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeDiscountDoc extends IFeeDiscount, Document {}

const feeDiscountSchema = new Schema<IFeeDiscountDoc>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discountType: {
      type: String,
      enum: ['FIXED_AMOUNT', 'PERCENTAGE'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ['SIBLING', 'MERIT', 'NEED_BASED', 'STAFF_WARD', 'GENERAL', 'SCHOLARSHIP'],
      default: 'GENERAL',
      required: true,
    },
    requiresApproval: {
      type: Boolean,
      default: true,
    },
    applicableFeeHeadIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'FeeHead',
      },
    ],
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
    collection: 'fee_discounts',
  }
);

feeDiscountSchema.index({ category: 1, status: 1 });

export const FeeDiscount = model<IFeeDiscountDoc>('FeeDiscount', feeDiscountSchema);
