import { Schema, model, Document, Types } from 'mongoose';

export interface IStopDocument extends Document {
  schoolId: string;
  stopName: string;
  stopCode: string;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
  };
  pickupTime: string;
  dropTime: string;
  landmark?: string;
  studentCount: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StopSchema = new Schema<IStopDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    stopName: { type: String, required: true },
    stopCode: { type: String, required: true, uppercase: true },
    gpsCoordinates: {
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    pickupTime: { type: String, required: true },
    dropTime: { type: String, required: true },
    landmark: { type: String },
    studentCount: { type: Number, default: 0, min: 0 },
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

StopSchema.index({ schoolId: 1, stopCode: 1 }, { unique: true });
StopSchema.index({ stopName: 1 });

export const Stop = model<IStopDocument>('Stop', StopSchema);
