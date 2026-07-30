import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmissionReview extends Document {
  applicationId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  oldStatus: string;
  newStatus: string;
  comments: string;
  interviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionReviewSchema = new Schema(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'AdmissionApplication', required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    oldStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    comments: { type: String, required: true },
    interviewNotes: { type: String },
  },
  { timestamps: true }
);

AdmissionReviewSchema.index({ applicationId: 1 });

export const AdmissionReview = mongoose.model<IAdmissionReview>('AdmissionReview', AdmissionReviewSchema);
