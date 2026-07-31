import { Schema, model, Document, Types } from 'mongoose';

export interface IBookIssue {
  schoolId: string;
  bookCopyId: Types.ObjectId;
  issuedToUserType: 'STUDENT' | 'EMPLOYEE';
  studentId?: Types.ObjectId;
  employeeId?: Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: 'ISSUED' | 'RETURNED' | 'OVERDUE' | 'LOST';
  issuedByUserId: Types.ObjectId;
  fineAmount: number;
  fineStatus: 'NONE' | 'PENDING' | 'PAID' | 'WAIVED' | 'PARTIAL';
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookIssueDocument extends IBookIssue, Document {}

const BookIssueSchema = new Schema<IBookIssueDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    bookCopyId: { type: Schema.Types.ObjectId, ref: 'BookCopy', required: true, index: true },
    issuedToUserType: { type: String, enum: ['STUDENT', 'EMPLOYEE'], required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date },
    status: {
      type: String,
      enum: ['ISSUED', 'RETURNED', 'OVERDUE', 'LOST'],
      default: 'ISSUED',
      index: true,
    },
    issuedByUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fineAmount: { type: Number, default: 0 },
    fineStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'PAID', 'WAIVED', 'PARTIAL'],
      default: 'NONE',
    },
  },
  { timestamps: true }
);

BookIssueSchema.index({ schoolId: 1, studentId: 1, status: 1 });
BookIssueSchema.index({ schoolId: 1, employeeId: 1, status: 1 });

export const BookIssue = model<IBookIssueDocument>('BookIssue', BookIssueSchema);
