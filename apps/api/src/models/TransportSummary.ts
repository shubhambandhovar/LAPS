import { Schema, model, Document, Types } from 'mongoose';

export interface ITransportSummaryDocument extends Document {
  schoolId: string;
  academicSessionId: Types.ObjectId;
  totalVehicles: number;
  activeVehicles: number;
  inMaintenanceVehicles: number;
  totalDrivers: number;
  totalRoutes: number;
  totalStops: number;
  totalAssignedStudents: number;
  totalFleetCapacity: number;
  overallOccupancyPercentage: number;
  vehicleUtilization?: Array<{
    vehicleId: Types.ObjectId;
    registrationNumber: string;
    capacity: number;
    activeAssignments: number;
    occupancyPercentage: number;
    status: string;
  }>;
  routeUtilization?: Array<{
    routeId: Types.ObjectId;
    routeName: string;
    totalStops: number;
    totalStudents: number;
    assignedVehicleId?: Types.ObjectId;
  }>;
  maintenanceSummary?: {
    totalSpendYearToDate: number;
    pendingRenewalsCount: number;
    vehiclesDueForServiceCount: number;
  };
  lastCalculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TransportSummarySchema = new Schema<ITransportSummaryDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      unique: true,
      index: true,
    },
    totalVehicles: { type: Number, default: 0, min: 0 },
    activeVehicles: { type: Number, default: 0, min: 0 },
    inMaintenanceVehicles: { type: Number, default: 0, min: 0 },
    totalDrivers: { type: Number, default: 0, min: 0 },
    totalRoutes: { type: Number, default: 0, min: 0 },
    totalStops: { type: Number, default: 0, min: 0 },
    totalAssignedStudents: { type: Number, default: 0, min: 0 },
    totalFleetCapacity: { type: Number, default: 0, min: 0 },
    overallOccupancyPercentage: { type: Number, default: 0, min: 0 },
    vehicleUtilization: [
      {
        vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
        registrationNumber: { type: String },
        capacity: { type: Number },
        activeAssignments: { type: Number },
        occupancyPercentage: { type: Number },
        status: { type: String },
      },
    ],
    routeUtilization: [
      {
        routeId: { type: Schema.Types.ObjectId, ref: 'Route' },
        routeName: { type: String },
        totalStops: { type: Number },
        totalStudents: { type: Number },
        assignedVehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
      },
    ],
    maintenanceSummary: {
      totalSpendYearToDate: { type: Number, default: 0, min: 0 },
      pendingRenewalsCount: { type: Number, default: 0, min: 0 },
      vehiclesDueForServiceCount: { type: Number, default: 0, min: 0 },
    },
    lastCalculatedAt: { type: Date, default: Date.now },
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

TransportSummarySchema.index({ schoolId: 1, academicSessionId: 1 }, { unique: true });

export const TransportSummary = model<ITransportSummaryDocument>(
  'TransportSummary',
  TransportSummarySchema,
);
