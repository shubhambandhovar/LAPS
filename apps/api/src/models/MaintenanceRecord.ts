import { Schema, model, Document, Types } from 'mongoose';

export interface IMaintenanceRecordDocument extends Document {
  schoolId: string;
  vehicleId: Types.ObjectId;
  maintenanceType:
    | 'SERVICE_SCHEDULE'
    | 'FUEL_LOG'
    | 'REPAIR'
    | 'INSURANCE_RENEWAL'
    | 'FITNESS_RENEWAL'
    | 'OTHER';
  serviceDate: Date;
  odometerReadingKm: number;
  costAmount: number;
  serviceProvider: string;
  description: string;
  nextScheduledDate?: Date;
  nextScheduledOdometerKm?: number;
  fuelDetails?: {
    liters: number;
    costPerLiter: number;
    fuelType: 'DIESEL' | 'PETROL' | 'CNG' | 'EV';
  };
  status: 'COMPLETED' | 'SCHEDULED' | 'IN_PROGRESS' | 'CANCELLED';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenanceRecordSchema = new Schema<IMaintenanceRecordDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    maintenanceType: {
      type: String,
      enum: [
        'SERVICE_SCHEDULE',
        'FUEL_LOG',
        'REPAIR',
        'INSURANCE_RENEWAL',
        'FITNESS_RENEWAL',
        'OTHER',
      ],
      required: true,
      index: true,
    },
    serviceDate: { type: Date, required: true },
    odometerReadingKm: { type: Number, required: true, min: 0 },
    costAmount: { type: Number, required: true, min: 0 },
    serviceProvider: { type: String, required: true },
    description: { type: String, required: true },
    nextScheduledDate: { type: Date },
    nextScheduledOdometerKm: { type: Number, min: 0 },
    fuelDetails: {
      liters: { type: Number },
      costPerLiter: { type: Number },
      fuelType: {
        type: String,
        enum: ['DIESEL', 'PETROL', 'CNG', 'EV'],
      },
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'SCHEDULED', 'IN_PROGRESS', 'CANCELLED'],
      default: 'COMPLETED',
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

MaintenanceRecordSchema.index({ vehicleId: 1, serviceDate: -1 });
MaintenanceRecordSchema.index({ maintenanceType: 1, status: 1 });

export const MaintenanceRecord = model<IMaintenanceRecordDocument>(
  'MaintenanceRecord',
  MaintenanceRecordSchema,
);
