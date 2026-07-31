import { Schema, model, Document, Types } from 'mongoose';

export interface IBookCopy {
  schoolId: string;
  bookId: Types.ObjectId;
  accessionNumber: string;
  barcode?: string;
  shelf?: string;
  rack?: string;
  condition: 'NEW' | 'GOOD' | 'FAIR' | 'POOR';
  status: 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookCopyDocument extends IBookCopy, Document {}

const BookCopySchema = new Schema<IBookCopyDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    accessionNumber: { type: String, required: true, index: true },
    barcode: { type: String, sparse: true, index: true },
    shelf: { type: String },
    rack: { type: String },
    condition: { type: String, enum: ['NEW', 'GOOD', 'FAIR', 'POOR'], default: 'NEW' },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ISSUED', 'RESERVED', 'LOST', 'DAMAGED', 'ARCHIVED'],
      default: 'AVAILABLE',
      index: true,
    },
  },
  { timestamps: true }
);

BookCopySchema.index({ schoolId: 1, accessionNumber: 1 }, { unique: true });
BookCopySchema.index({ schoolId: 1, barcode: 1 }, { unique: true, sparse: true });

export const BookCopy = model<IBookCopyDocument>('BookCopy', BookCopySchema);
