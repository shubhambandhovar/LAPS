import { Schema, model, Document, Types } from 'mongoose';

export interface IPayroll {
  month: number; // 1-12
  year: number;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  totalDeductions: number;
  processedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayrollDocument extends IPayroll, Document {}

const PayrollSchema = new Schema<IPayrollDocument>(
  {
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    status: { type: String, enum: ['DRAFT', 'APPROVED', 'PAID'], default: 'DRAFT', index: true },
    totalEmployees: { type: Number, default: 0 },
    totalGross: { type: Number, default: 0 },
    totalNet: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    paidAt: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Ensure unique month-year combination
PayrollSchema.index({ month: 1, year: 1 }, { unique: true });

export const Payroll = model<IPayrollDocument>('Payroll', PayrollSchema);
