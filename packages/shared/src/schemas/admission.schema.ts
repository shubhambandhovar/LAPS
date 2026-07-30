import { z } from 'zod';

export const admissionCycleSchema = z.object({
  academicSessionId: z.string(),
  name: z.string().min(3),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['OPEN', 'CLOSED', 'DRAFT']).default('DRAFT'),
});

export const seatAllocationSchema = z.object({
  admissionCycleId: z.string(),
  classId: z.string(),
  totalSeats: z.number().int().nonnegative(),
  reservedSeats: z.number().int().nonnegative().default(0),
});

export const admissionApplicationSchema = z.object({
  admissionCycleId: z.string(),
  appliedClassId: z.string(),
  studentInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dob: z.string(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    bloodGroup: z.string().optional(),
    religion: z.string().optional(),
    category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'OTHER']).optional(),
    address: z.string().min(10),
  }),
  guardianInfo: z.object({
    name: z.string().min(1),
    relationship: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']),
    phone: z.string().min(10),
    email: z.string().email().optional(),
    occupation: z.string().optional(),
  }),
  previousSchool: z.object({
    name: z.string().optional(),
    leavingReason: z.string().optional(),
    lastClassPassed: z.string().optional(),
  }).optional(),
});

export const admissionReviewSchema = z.object({
  newStatus: z.enum(['APPROVED', 'REJECTED', 'WAITLISTED', 'DOCUMENTS_PENDING', 'UNDER_REVIEW']),
  comments: z.string(),
  interviewNotes: z.string().optional(),
});
