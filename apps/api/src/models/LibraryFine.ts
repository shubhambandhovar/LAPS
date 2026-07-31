import { Schema, model, Document, Types } from 'mongoose';

export interface ILibraryFine {
  schoolId: string;
  bookIssueId: Types.ObjectId;
  studentId?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  fineAmount: number;
  waiverAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'WAIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface ILibraryFineDocument extends ILibraryFine, Document {}

const LibraryFineSchema = new Schema<ILibraryFineDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    bookIssueId: { type: Schema.Types.ObjectId, ref: 'BookIssue', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    fineAmount: { type: Number, required: true, min: 0 },
    waiverAmount: { type: Number, default: 0, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    outstandingAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'PAID', 'WAIVED'],
      default: 'PENDING',
      index: true,
    },
  },
  { timestamps: true }
);

LibraryFineSchema.index({ schoolId: 1, studentId: 1, status: 1 });
LibraryFineSchema.index({ schoolId: 1, employeeId: 1, status: 1 });

export const LibraryFine = model<ILibraryFineDocument>('LibraryFine', LibraryFineSchema);
