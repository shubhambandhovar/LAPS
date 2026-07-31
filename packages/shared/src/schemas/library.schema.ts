import { z } from 'zod';

export const BookStatusEnum = z.enum([
  'AVAILABLE',
  'ISSUED',
  'RESERVED',
  'LOST',
  'DAMAGED',
  'ARCHIVED',
]);

export const BookConditionEnum = z.enum(['NEW', 'GOOD', 'FAIR', 'POOR']);

export const BookSchema = z.object({
  bookCode: z.string().min(1).max(50),
  isbn: z.string().min(1).max(20).optional(),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200).optional(),
  authors: z.array(z.string().min(1)).min(1),
  publisher: z.string().max(100).optional(),
  edition: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().url().optional(),
});

export const CreateBookSchema = BookSchema;
export const UpdateBookSchema = BookSchema.partial();

export const BookCopySchema = z.object({
  bookId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Book ID'),
  accessionNumber: z.string().min(1).max(50),
  barcode: z.string().max(50).optional(),
  shelf: z.string().max(50).optional(),
  rack: z.string().max(50).optional(),
  condition: BookConditionEnum.default('NEW'),
  status: BookStatusEnum.default('AVAILABLE'),
});

export const CreateBookCopySchema = BookCopySchema.omit({ bookId: true });
export const UpdateBookCopySchema = BookCopySchema.partial();

export const IssueBookSchema = z.object({
  bookCopyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Book Copy ID'),
  issuedToUserType: z.enum(['STUDENT', 'EMPLOYEE']),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Student ID').optional(),
  employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID').optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
}).refine(data => {
  if (data.issuedToUserType === 'STUDENT' && !data.studentId) return false;
  if (data.issuedToUserType === 'EMPLOYEE' && !data.employeeId) return false;
  return true;
}, {
  message: 'Corresponding ID must be provided based on user type',
  path: ['studentId'],
});

export const ReturnBookSchema = z.object({
  returnCondition: BookConditionEnum.default('GOOD'),
  remarks: z.string().max(500).optional(),
});

export const ReservationSchema = z.object({
  bookId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Book ID'),
  reservedByUserType: z.enum(['STUDENT', 'EMPLOYEE']),
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Student ID').optional(),
  employeeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Employee ID').optional(),
}).refine(data => {
  if (data.reservedByUserType === 'STUDENT' && !data.studentId) return false;
  if (data.reservedByUserType === 'EMPLOYEE' && !data.employeeId) return false;
  return true;
}, {
  message: 'Corresponding ID must be provided based on user type',
  path: ['studentId'],
});

export const FinePaymentSchema = z.object({
  amountPaid: z.number().min(0),
  amountWaived: z.number().min(0).default(0),
  remarks: z.string().max(500).optional(),
});
