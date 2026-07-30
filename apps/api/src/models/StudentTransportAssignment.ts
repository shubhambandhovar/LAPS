import { Schema, model, Document, Types } from 'mongoose';

export interface IStudentTransportAssignmentDocument extends Document {
  schoolId: string;
  studentId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  academicSessionId: Types.ObjectId;
  routeId: Types.ObjectId;
  stopId: Types.ObjectId;
  vehicleId: Types.ObjectId;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  transportFeeAmount: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'COMPLETED';
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StudentTransportAssignmentSchema = new Schema<IStudentTransportAssignmentDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: 'Enrollment', required: true, index: true },
    academicSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AcademicSession',
      required: true,
      index: true,
    },
    routeId: { type: Schema.Types.ObjectId, ref: 'Route', required: true, index: true },
    stopId: { type: Schema.Types.ObjectId, ref: 'Stop', required: true, index: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    effectiveFrom: { type: Date, required: true, default: Date.now },
    effectiveUntil: { type: Date },
    transportFeeAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'CANCELLED', 'COMPLETED'],
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

StudentTransportAssignmentSchema.index({ studentId: 1, academicSessionId: 1, status: 1 });
StudentTransportAssignmentSchema.index({ routeId: 1, stopId: 1, status: 1 });
StudentTransportAssignmentSchema.index({ vehicleId: 1, status: 1 });

export const StudentTransportAssignment = model<IStudentTransportAssignmentDocument>(
  'StudentTransportAssignment',
  StudentTransportAssignmentSchema,
);
