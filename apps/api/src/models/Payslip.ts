import { Schema, model, Document, Types } from 'mongoose';
import { ISalaryComponent } from './SalaryStructure';

export interface IPayslip {
  payrollId: Types.ObjectId;
  employeeId: Types.ObjectId;
  month: number;
  year: number;
  basicSalary: number;
  allowances: ISalaryComponent[];
  deductions: ISalaryComponent[];
  grossSalary: number;
  netSalary: number;
  status: 'GENERATED' | 'PAID';
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayslipDocument extends IPayslip, Document {}

const PayslipComponentSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['FIXED', 'PERCENTAGE'], required: true },
});

const PayslipSchema = new Schema<IPayslipDocument>(
  {
    payrollId: { type: Schema.Types.ObjectId, ref: 'Payroll', required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000 },
    basicSalary: { type: Number, required: true },
    allowances: { type: [PayslipComponentSchema], default: [] },
    deductions: { type: [PayslipComponentSchema], default: [] },
    grossSalary: { type: Number, required: true },
    netSalary: { type: Number, required: true },
    status: { type: String, enum: ['GENERATED', 'PAID'], default: 'GENERATED', index: true },
    paidDate: { type: Date },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

PayslipSchema.index({ payrollId: 1, employeeId: 1 }, { unique: true });
PayslipSchema.index({ month: 1, year: 1 });

export const Payslip = model<IPayslipDocument>('Payslip', PayslipSchema);
