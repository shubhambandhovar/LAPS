import { Request, Response } from 'express';
import { Book, BookCopy } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { CreateBookSchema, UpdateBookSchema, CreateBookCopySchema } from '@laps/shared';
import { isValidObjectId } from 'mongoose';

export class LibraryBookController {
  // --- Book Catalog Management ---

  static async getBooks(req: Request, res: Response) {
    try {
      const books = await Book.find({ schoolId: req.user?.schoolId }).sort({ title: 1 });
      return sendSuccess(res, 200, 'Success', { books });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch books');
    }
  }

  static async getBookById(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Book ID');
      const book = await Book.findOne({ _id: req.params.id, schoolId: req.user?.schoolId });
      if (!book) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Book not found');
      return sendSuccess(res, 200, 'Success', { book });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch book');
    }
  }

  static async createBook(req: Request, res: Response) {
    try {
      const data = CreateBookSchema.parse(req.body);
      
      const existing = await Book.findOne({ schoolId: req.user?.schoolId, bookCode: data.bookCode });
      if (existing) return sendError(res, 409, 'DUPLICATE_RESOURCE', 'Book with this bookCode already exists');

      const book = new Book({ ...data, schoolId: req.user?.schoolId });
      await book.save();
      return sendSuccess(res, 201, 'Success', { book });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to create book');
    }
  }

  static async updateBook(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Book ID');
      const data = UpdateBookSchema.parse(req.body);
      
      const book = await Book.findOneAndUpdate(
        { _id: req.params.id, schoolId: req.user?.schoolId },
        { $set: data },
        { new: true }
      );
      if (!book) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Book not found');
      
      return sendSuccess(res, 200, 'Success', { book });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to update book');
    }
  }

  // --- Book Copy Management ---

  static async getBookCopies(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.bookId)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Book ID');
      const copies = await BookCopy.find({ bookId: req.params.bookId, schoolId: req.user?.schoolId }).sort({ accessionNumber: 1 });
      return sendSuccess(res, 200, 'Success', { copies });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch book copies');
    }
  }

  static async createBookCopy(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.bookId)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Book ID');
      const book = await Book.findOne({ _id: req.params.bookId, schoolId: req.user?.schoolId });
      if (!book) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Book not found');

      const data = CreateBookCopySchema.parse(req.body);

      const existingAccession = await BookCopy.findOne({ schoolId: req.user?.schoolId, accessionNumber: data.accessionNumber });
      if (existingAccession) return sendError(res, 409, 'DUPLICATE_RESOURCE', 'Book copy with this accessionNumber already exists');

      if (data.barcode) {
        const existingBarcode = await BookCopy.findOne({ schoolId: req.user?.schoolId, barcode: data.barcode });
        if (existingBarcode) return sendError(res, 409, 'DUPLICATE_RESOURCE', 'Book copy with this barcode already exists');
      }

      const copy = new BookCopy({ ...data, bookId: book._id, schoolId: req.user?.schoolId });
      await copy.save();
      return sendSuccess(res, 201, 'Success', { copy });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to create book copy');
    }
  }
}
