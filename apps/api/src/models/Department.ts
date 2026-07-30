import { Schema, model, Document, Types } from 'mongoose';

export interface IDepartment {
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartmentDocument extends IDepartment, Document {}

const DepartmentSchema = new Schema<IDepartmentDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Department = model<IDepartmentDocument>('Department', DepartmentSchema);
