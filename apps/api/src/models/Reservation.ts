import { Schema, model, Document, Types } from 'mongoose';

export interface IReservation {
  schoolId: string;
  bookId: Types.ObjectId;
  reservedByUserType: 'STUDENT' | 'EMPLOYEE';
  studentId?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  reservationDate: Date;
  expiryDate: Date;
  queuePosition: number;
  status: 'PENDING' | 'FULFILLED' | 'EXPIRED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IReservationDocument extends IReservation, Document {}

const ReservationSchema = new Schema<IReservationDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    reservedByUserType: { type: String, enum: ['STUDENT', 'EMPLOYEE'], required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    reservationDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date, required: true },
    queuePosition: { type: Number, required: true, default: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'FULFILLED', 'EXPIRED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
  },
  { timestamps: true }
);

ReservationSchema.index({ schoolId: 1, studentId: 1, status: 1 });
ReservationSchema.index({ schoolId: 1, employeeId: 1, status: 1 });

export const Reservation = model<IReservationDocument>('Reservation', ReservationSchema);
