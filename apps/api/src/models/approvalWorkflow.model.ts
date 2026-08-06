import mongoose, { Schema, Document } from 'mongoose';
import { DocumentType, ApprovalWorkflow as ApprovalWorkflowType } from '@laps/shared';

export interface ApprovalWorkflowDocument extends Document, Omit<ApprovalWorkflowType, 'id' | 'createdAt' | 'updatedAt'> {}

const approvalWorkflowSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    name: { type: String, required: true },
    documentType: { type: String, enum: Object.values(DocumentType), required: true },
    requiredRoles: [{ type: String, required: true }],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret: any) => {
        delete ret._id;
        delete ret.__v;
      },
    },
  },
);

export const ApprovalWorkflowDb = mongoose.model<ApprovalWorkflowDocument>('ApprovalWorkflow', approvalWorkflowSchema);
