import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmissionCycle extends Document {
  academicSessionId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionCycleSchema = new Schema(
  {
    academicSessionId: { type: Schema.Types.ObjectId, ref: 'AcademicSession', required: true },
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['OPEN', 'CLOSED', 'DRAFT'], default: 'DRAFT' },
  },
  { timestamps: true }
);

AdmissionCycleSchema.index({ academicSessionId: 1, name: 1 }, { unique: true });

export const AdmissionCycle = mongoose.model<IAdmissionCycle>('AdmissionCycle', AdmissionCycleSchema);
