import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmissionDocument extends Document {
  applicationId: mongoose.Types.ObjectId;
  documentType: 'BIRTH_CERTIFICATE' | 'TRANSFER_CERTIFICATE' | 'AADHAR' | 'PHOTOGRAPH' | 'REPORT_CARD' | 'CUSTOM';
  fileUrl: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionDocumentSchema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'AdmissionApplication', required: true },
    documentType: {
      type: String,
      enum: ['BIRTH_CERTIFICATE', 'TRANSFER_CERTIFICATE', 'AADHAR', 'PHOTOGRAPH', 'REPORT_CARD', 'CUSTOM'],
      required: true,
    },
    fileUrl: { type: String, required: true },
    verificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
    remarks: { type: String },
  },
  { timestamps: true }
);

AdmissionDocumentSchema.index({ applicationId: 1 });

export const AdmissionDocument = mongoose.model<IAdmissionDocument>('AdmissionDocument', AdmissionDocumentSchema);
