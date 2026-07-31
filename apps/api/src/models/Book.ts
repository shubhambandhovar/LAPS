import { Schema, model, Document } from 'mongoose';

export interface IBook {
  schoolId: string;
  bookCode: string;
  isbn?: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  edition?: string;
  category?: string;
  language?: string;
  description?: string;
  coverImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookDocument extends IBook, Document {}

const BookSchema = new Schema<IBookDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    bookCode: { type: String, required: true, index: true },
    isbn: { type: String, index: true },
    title: { type: String, required: true },
    subtitle: { type: String },
    authors: [{ type: String, required: true }],
    publisher: { type: String },
    edition: { type: String },
    category: { type: String },
    language: { type: String },
    description: { type: String },
    coverImageUrl: { type: String },
  },
  { timestamps: true }
);

BookSchema.index({ schoolId: 1, bookCode: 1 }, { unique: true });

export const Book = model<IBookDocument>('Book', BookSchema);
