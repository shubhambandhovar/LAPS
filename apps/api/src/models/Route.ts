import { Schema, model, Document, Types } from 'mongoose';

export interface IRouteStopItem {
  stopId: Types.ObjectId;
  orderSequence: number;
  estimatedArrivalFromStartMinutes: number;
  studentCount: number;
}

export interface IRouteDocument extends Document {
  schoolId: string;
  routeName: string;
  routeCode: string;
  source: {
    name: string;
    address?: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  destination: {
    name: string;
    address?: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  stops: IRouteStopItem[];
  estimatedDurationMinutes: number;
  distanceKm: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RouteStopItemSchema = new Schema(
  {
    stopId: { type: Schema.Types.ObjectId, ref: 'Stop', required: true },
    orderSequence: { type: Number, required: true, min: 1 },
    estimatedArrivalFromStartMinutes: { type: Number, required: true, min: 0 },
    studentCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const RouteSchema = new Schema<IRouteDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    routeName: { type: String, required: true },
    routeCode: { type: String, required: true, uppercase: true },
    source: {
      name: { type: String, required: true },
      address: { type: String },
      gpsCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    destination: {
      name: { type: String, required: true },
      address: { type: String },
      gpsCoordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
    },
    stops: { type: [RouteStopItemSchema], default: [] },
    estimatedDurationMinutes: { type: Number, required: true, min: 1 },
    distanceKm: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
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

RouteSchema.index({ schoolId: 1, routeCode: 1 }, { unique: true });
RouteSchema.index({ schoolId: 1, routeName: 1 }, { unique: true });

export const Route = model<IRouteDocument>('Route', RouteSchema);
