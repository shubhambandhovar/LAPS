/**
 * FeeHead Model — Collection #47
 *
 * Master catalog of fee categories and charge heads.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { FeeHeadCategory, FeeFrequency, FeeHeadStatus } from '@laps/shared';

export interface IFeeHead {
  name: string;
  code: string;
  category: FeeHeadCategory;
  frequency: FeeFrequency;
  isRefundable: boolean;
  description?: string;
  status: FeeHeadStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeHeadDoc extends IFeeHead, Document {}

const feeHeadSchema = new Schema<IFeeHeadDoc>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      enum: [
        'ADMISSION',
        'TUITION',
        'EXAMINATION',
        'LIBRARY',
        'LABORATORY',
        'SPORTS',
        'DEVELOPMENT',
        'TRANSPORT',
        'CUSTOM',
      ],
      default: 'TUITION',
      required: true,
    },
    frequency: {
      type: String,
      enum: ['ONE_TIME', 'MONTHLY', 'QUARTERLY', 'BI_ANNUALLY', 'ANNUALLY'],
      default: 'QUARTERLY',
      required: true,
    },
    isRefundable: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
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
    collection: 'fee_heads',
  }
);

feeHeadSchema.index({ category: 1, status: 1 });

export const FeeHead = model<IFeeHeadDoc>('FeeHead', feeHeadSchema);
