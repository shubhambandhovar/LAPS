import { Schema, model, Document, Types } from 'mongoose';

export interface IAssetAssignment {
  schoolId: string;
  assetId: Types.ObjectId;
  assignedToType: 'EMPLOYEE' | 'DEPARTMENT';
  employeeId?: Types.ObjectId;
  departmentId?: Types.ObjectId;
  assignedDate: Date;
  returnedDate?: Date;
  conditionOnIssue?: string;
  conditionOnReturn?: string;
  status: 'ASSIGNED' | 'RETURNED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssetAssignmentDocument extends IAssetAssignment, Document {}

const AssetAssignmentSchema = new Schema<IAssetAssignmentDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true, index: true },
    assignedToType: { type: String, enum: ['EMPLOYEE', 'DEPARTMENT'], required: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    assignedDate: { type: Date, required: true, default: Date.now },
    returnedDate: { type: Date },
    conditionOnIssue: { type: String },
    conditionOnReturn: { type: String },
    status: {
      type: String,
      enum: ['ASSIGNED', 'RETURNED'],
      default: 'ASSIGNED',
      index: true,
    },
  },
  { timestamps: true }
);

AssetAssignmentSchema.index({ schoolId: 1, employeeId: 1, status: 1 });
AssetAssignmentSchema.index({ schoolId: 1, departmentId: 1, status: 1 });

export const AssetAssignment = model<IAssetAssignmentDocument>('AssetAssignment', AssetAssignmentSchema);
