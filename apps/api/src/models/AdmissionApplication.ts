import mongoose, { Schema, Document } from 'mongoose';

export interface IAdmissionApplication extends Document {
  applicationNumber: string;
  admissionCycleId: mongoose.Types.ObjectId;
  appliedClassId: mongoose.Types.ObjectId;
  applicantUserId: mongoose.Types.ObjectId;
  studentInfo: {
    firstName: string;
    lastName: string;
    dob: Date;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    religion?: string;
    category?: 'GENERAL' | 'OBC' | 'SC' | 'ST' | 'OTHER';
    address: string;
  };
  guardianInfo: {
    name: string;
    relationship: 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN' | 'OTHER';
    phone: string;
    email?: string;
    occupation?: string;
  };
  previousSchool?: {
    name?: string;
    leavingReason?: string;
    lastClassPassed?: string;
  };
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'DOCUMENTS_PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WAITLISTED';
  submissionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdmissionApplicationSchema = new Schema(
  {
    applicationNumber: { type: String, unique: true, sparse: true },
    admissionCycleId: { type: Schema.Types.ObjectId, ref: 'AdmissionCycle', required: true },
    appliedClassId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    applicantUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    studentInfo: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      dob: { type: Date, required: true },
      gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER'], required: true },
      bloodGroup: { type: String },
      religion: { type: String },
      category: { type: String, enum: ['GENERAL', 'OBC', 'SC', 'ST', 'OTHER'] },
      address: { type: String, required: true },
    },
    guardianInfo: {
      name: { type: String, required: true },
      relationship: { type: String, enum: ['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER'], required: true },
      phone: { type: String, required: true },
      email: { type: String },
      occupation: { type: String },
    },
    previousSchool: {
      name: { type: String },
      leavingReason: { type: String },
      lastClassPassed: { type: String },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WAITLISTED'],
      default: 'DRAFT',
    },
    submissionDate: { type: Date },
  },
  { timestamps: true }
);

AdmissionApplicationSchema.index({ admissionCycleId: 1, appliedClassId: 1 });
AdmissionApplicationSchema.index({ applicantUserId: 1 });
AdmissionApplicationSchema.index({ applicationNumber: 1 });

export const AdmissionApplication = mongoose.model<IAdmissionApplication>('AdmissionApplication', AdmissionApplicationSchema);
