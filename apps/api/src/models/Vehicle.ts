import { Schema, model, Document, Types } from 'mongoose';

export interface IVehicleDocument extends Document {
  schoolId: string;
  registrationNumber: string;
  vehicleType: 'BUS' | 'VAN' | 'MINI_BUS' | 'CAR' | 'OTHER';
  capacity: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'RETIRED';
  insuranceDetails?: {
    policyNumber: string;
    insurer: string;
    validFrom: Date;
    validUntil: Date;
    documentUrl?: string;
  };
  fitnessCertificate?: {
    certificateNumber: string;
    validFrom: Date;
    validUntil: Date;
    documentUrl?: string;
  };
  maintenanceSchedule?: {
    lastServiceDate?: Date;
    nextServiceDate?: Date;
    intervalDays: number;
    mileageAtLastService?: number;
  };
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicleDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ['BUS', 'VAN', 'MINI_BUS', 'CAR', 'OTHER'],
      default: 'BUS',
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE', 'RETIRED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    insuranceDetails: {
      policyNumber: { type: String },
      insurer: { type: String },
      validFrom: { type: Date },
      validUntil: { type: Date },
      documentUrl: { type: String },
    },
    fitnessCertificate: {
      certificateNumber: { type: String },
      validFrom: { type: Date },
      validUntil: { type: Date },
      documentUrl: { type: String },
    },
    maintenanceSchedule: {
      lastServiceDate: { type: Date },
      nextServiceDate: { type: Date },
      intervalDays: { type: Number, default: 90 },
      mileageAtLastService: { type: Number },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    archivedAt: { type: Date },
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

VehicleSchema.index({ schoolId: 1, registrationNumber: 1 }, { unique: true });
VehicleSchema.index({ 'insuranceDetails.validUntil': 1 });
VehicleSchema.index({ 'fitnessCertificate.validUntil': 1 });

export const Vehicle = model<IVehicleDocument>('Vehicle', VehicleSchema);
