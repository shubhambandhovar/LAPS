import mongoose, { Schema, Document } from 'mongoose';

export interface ISeatAllocation extends Document {
  admissionCycleId: mongoose.Types.ObjectId;
  classId: mongoose.Types.ObjectId;
  totalSeats: number;
  availableSeats: number;
  reservedSeats: number;
  waitlistCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SeatAllocationSchema = new Schema(
  {
    admissionCycleId: { type: Schema.Types.ObjectId, ref: 'AdmissionCycle', required: true },
    classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    reservedSeats: { type: Number, default: 0 },
    waitlistCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

SeatAllocationSchema.index({ admissionCycleId: 1, classId: 1 }, { unique: true });

export const SeatAllocation = mongoose.model<ISeatAllocation>('SeatAllocation', SeatAllocationSchema);
