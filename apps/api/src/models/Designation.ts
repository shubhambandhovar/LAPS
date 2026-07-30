import { Schema, model, Document, Types } from 'mongoose';

export interface IDesignation {
  name: string;
  departmentId: Types.ObjectId;
  level: number;
  isActive: boolean;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDesignationDocument extends IDesignation, Document {}

const DesignationSchema = new Schema<IDesignationDocument>(
  {
    name: { type: String, required: true, trim: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    level: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

export const Designation = model<IDesignationDocument>('Designation', DesignationSchema);
