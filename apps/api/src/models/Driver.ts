import { Schema, model, Document, Types } from 'mongoose';

export interface IDriverDocument extends Document {
  schoolId: string;
  driverProfile: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pinCode: string;
    profilePictureUrl?: string;
  };
  licenseDetails: {
    licenseNumber: string;
    licenseType: string;
    issuingAuthority: string;
    validFrom: Date;
    validUntil: Date;
    documentUrl?: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalExpiry: Date;
  backgroundVerification?: {
    isVerified: boolean;
    verificationDate?: Date;
    agencyName?: string;
    referenceNumber?: string;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  };
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'INACTIVE';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriverDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    driverProfile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pinCode: { type: String, required: true },
      profilePictureUrl: { type: String },
    },
    licenseDetails: {
      licenseNumber: { type: String, required: true, unique: true },
      licenseType: { type: String, required: true },
      issuingAuthority: { type: String, required: true },
      validFrom: { type: Date, required: true },
      validUntil: { type: Date, required: true },
      documentUrl: { type: String },
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
    medicalExpiry: { type: Date, required: true },
    backgroundVerification: {
      isVerified: { type: Boolean, default: false },
      verificationDate: { type: Date },
      agencyName: { type: String },
      referenceNumber: { type: String },
      status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING',
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'INACTIVE'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.__v;
        ret.id = ret._id ? ret._id.toString() : undefined;
        return ret;
      },
    },
  },
);

DriverSchema.index({ schoolId: 1, 'licenseDetails.licenseNumber': 1 }, { unique: true });
DriverSchema.index({ status: 1 });
DriverSchema.index({ 'licenseDetails.validUntil': 1 });
DriverSchema.index({ medicalExpiry: 1 });

export const Driver = model<IDriverDocument>('Driver', DriverSchema);
