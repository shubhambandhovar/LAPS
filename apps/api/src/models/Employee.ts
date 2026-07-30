import { Schema, model, Document, Types } from 'mongoose';

export interface IEmployee {
  userId?: Types.ObjectId; // Nullable until onboarded
  employeeId: string;
  type: 'TEACHING' | 'NON_TEACHING';
  departmentId: Types.ObjectId;
  designationId: Types.ObjectId;
  joiningDate: Date;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT';
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RESIGNED';
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  qualifications?: string[];
  experience?: string;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmployeeDocument extends IEmployee, Document {}

const EmployeeSchema = new Schema<IEmployeeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true, index: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    type: { type: String, enum: ['TEACHING', 'NON_TEACHING'], required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    designationId: { type: Schema.Types.ObjectId, ref: 'Designation', required: true },
    joiningDate: { type: Date, required: true },
    employmentType: { type: String, enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT'], required: true },
    status: { type: String, enum: ['ACTIVE', 'ON_LEAVE', 'TERMINATED', 'RESIGNED'], default: 'ACTIVE', index: true },
    emergencyContact: {
      name: { type: String, trim: true },
      relation: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
    qualifications: [{ type: String }],
    experience: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Employee = model<IEmployeeDocument>('Employee', EmployeeSchema);
