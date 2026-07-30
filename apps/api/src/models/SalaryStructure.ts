import { Schema, model, Document, Types } from 'mongoose';

export interface ISalaryComponent {
  name: string;
  amount: number;
  type: 'FIXED' | 'PERCENTAGE';
}

export interface ISalaryStructure {
  employeeId: Types.ObjectId;
  effectiveFrom: Date;
  basicSalary: number;
  allowances: ISalaryComponent[];
  deductions: ISalaryComponent[];
  employerContributions: { name: string; amount: number }[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISalaryStructureDocument extends ISalaryStructure, Document {}

const SalaryComponentSchema = new Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['FIXED', 'PERCENTAGE'], required: true },
});

const SalaryStructureSchema = new Schema<ISalaryStructureDocument>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    effectiveFrom: { type: Date, required: true },
    basicSalary: { type: Number, required: true, min: 0 },
    allowances: { type: [SalaryComponentSchema], default: [] },
    deductions: { type: [SalaryComponentSchema], default: [] },
    employerContributions: {
      type: [
        {
          name: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const SalaryStructure = model<ISalaryStructureDocument>('SalaryStructure', SalaryStructureSchema);
