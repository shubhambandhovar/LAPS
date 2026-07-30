/**
 * FeeStructure Model — Collection #48
 *
 * Master template of fee charges per academic session and class.
 */

import { Schema, model, Document, Types } from 'mongoose';
import { FeeStructureStatus } from '@laps/shared';

export interface IFeeComponent {
  feeHeadId: Types.ObjectId;
  amount: number;
  isOptional: boolean;
  isTransport: boolean;
}

export interface IFeeInstallment {
  installmentNumber: number;
  name: string;
  percentage: number;
  amount: number;
  dueDate: Date;
  lateFeeRuleId?: Types.ObjectId;
}

export interface IFeeStructure {
  name: string;
  academicSessionId: Types.ObjectId;
  financialYearId?: Types.ObjectId;
  classId: Types.ObjectId;
  feeComponents: IFeeComponent[];
  totalAmount: number;
  installments: IFeeInstallment[];
  applicableDiscountIds: Types.ObjectId[];
  status: FeeStructureStatus;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeStructureDoc extends IFeeStructure, Document {}

const feeComponentSchema = new Schema<IFeeComponent>(
  {
    feeHeadId: {
      type: Schema.Types.ObjectId,
      ref: 'FeeHead',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
    isTransport: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const feeInstallmentSchema = new Schema<IFeeInstallment>(
  {
    installmentNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    lateFeeRuleId: {
      type: Schema.Types.ObjectId,
      ref: 'LateFeeRule',
    },
  },
  { _id: false }
);

const feeStructureSchema = new Schema<IFeeStructureDoc>(
  {
    name: {
      type: String,
      required: true,
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
    classId: {
      type: Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    feeComponents: {
      type: [feeComponentSchema],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    installments: {
      type: [feeInstallmentSchema],
      required: true,
    },
    applicableDiscountIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'FeeDiscount',
      },
    ],
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'ARCHIVED'],
      default: 'DRAFT',
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
    collection: 'fee_structures',
  }
);

feeStructureSchema.index({ academicSessionId: 1, classId: 1, status: 1 });
feeStructureSchema.index({ status: 1 });

export const FeeStructure = model<IFeeStructureDoc>('FeeStructure', feeStructureSchema);
