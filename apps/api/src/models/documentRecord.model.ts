import mongoose, { Schema, Document } from 'mongoose';
import { DocumentType, DocumentStatus, DocumentRecord as DocumentRecordType } from '@laps/shared';

export interface DocumentRecordDocument extends Document, Omit<DocumentRecordType, 'id' | 'createdAt' | 'updatedAt'> {}

const documentRecordSchema = new Schema(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: 'School' },
    serialNumber: { type: String, required: true },
    documentType: { type: String, enum: Object.values(DocumentType), required: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'DocumentTemplate', required: true },
    workflowId: { type: Schema.Types.ObjectId, ref: 'ApprovalWorkflow' },
    referenceId: { type: String, required: true },
    referenceModel: { type: String, enum: ['Student', 'Teacher', 'Employee'], required: true },
    status: { type: String, enum: Object.values(DocumentStatus), default: DocumentStatus.ISSUED },
    issuedDate: { type: Date },
    expiryDate: { type: Date },
    qrCodeToken: { type: String },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 },
    signatures: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      signatureId: { type: Schema.Types.ObjectId, ref: 'UserSignature' },
      role: { type: String },
      timestamp: { type: Date },
      ipAddress: { type: String },
    }],
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

documentRecordSchema.index({ schoolId: 1, serialNumber: 1 }, { unique: true });

export const DocumentRecordDb = mongoose.model<DocumentRecordDocument>('DocumentRecord', documentRecordSchema);
