import { Schema, model, Document, Types } from 'mongoose';

export interface IGpsLocationDocument extends Document {
  schoolId: string;
  vehicleId: Types.ObjectId;
  routeId?: Types.ObjectId;
  driverId?: Types.ObjectId;
  timestamp: Date;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  speedKmh: number;
  headingDegrees: number;
  lastKnownLocationAddress?: string;
  routeProgress?: {
    nextStopId?: Types.ObjectId;
    etaMinutes?: number;
    distanceRemainingKm?: number;
    isOffRoute?: boolean;
  };
  status: 'LIVE' | 'IDLE' | 'OFFLINE';
  createdAt: Date;
  updatedAt: Date;
}

const GpsLocationSchema = new Schema<IGpsLocationDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', index: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    coordinates: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    speedKmh: { type: Number, required: true, default: 0, min: 0 },
    headingDegrees: { type: Number, required: true, default: 0, min: 0, max: 359 },
    lastKnownLocationAddress: { type: String },
    routeProgress: {
      nextStopId: { type: Schema.Types.ObjectId, ref: 'Stop' },
      etaMinutes: { type: Number, min: 0 },
      distanceRemainingKm: { type: Number, min: 0 },
      isOffRoute: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['LIVE', 'IDLE', 'OFFLINE'],
      default: 'LIVE',
      required: true,
    },
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

GpsLocationSchema.index({ vehicleId: 1, timestamp: -1 });
GpsLocationSchema.index({ routeId: 1, timestamp: -1 });

export const GpsLocation = model<IGpsLocationDocument>('GpsLocation', GpsLocationSchema);
