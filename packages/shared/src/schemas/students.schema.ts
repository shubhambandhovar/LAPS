import { z } from 'zod';

export const EmergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
});

export type EmergencyContactInput = z.infer<typeof EmergencyContactSchema>;

export const StudentDocumentSchema = z.object({
  title: z.string().min(1, 'Document title is required'),
  category: z.string().optional(),
  fileUrl: z.string().url('Must be a valid URL'),
  uploadedAt: z.string().optional(),
});

export type StudentDocumentInput = z.infer<typeof StudentDocumentSchema>;

export const CreateStudentSchema = z.object({
  admissionNumber: z.string().trim().optional(), // Auto-generated if omitted
  admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid admission date required').optional(),
  firstName: z.string().min(1, 'First name is required').max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1, 'Last name is required').max(50),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date of birth required'),
  bloodGroup: z.string().max(10).optional(),
  category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'OTHER']).optional(),
  religion: z.string().max(50).optional(),
  nationality: z.string().default('Indian'),
  photoUrl: z.string().url('Must be a valid photo URL').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  city: z.string().default('Gohad'),
  state: z.string().default('Madhya Pradesh'),
  country: z.string().default('India'),
  pinCode: z.string().min(6, 'PIN code must be at least 6 characters'),
  emergencyContacts: z.array(EmergencyContactSchema).min(1, 'At least one emergency contact is required'),
  documents: z.array(StudentDocumentSchema).default([]),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;

export const UpdateStudentSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid date of birth required').optional(),
  bloodGroup: z.string().max(10).optional(),
  category: z.enum(['GENERAL', 'OBC', 'SC', 'ST', 'OTHER']).optional(),
  religion: z.string().max(50).optional(),
  nationality: z.string().optional(),
  photoUrl: z.string().url().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pinCode: z.string().optional(),
  emergencyContacts: z.array(EmergencyContactSchema).optional(),
  documents: z.array(StudentDocumentSchema).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateStudentInput = z.infer<typeof UpdateStudentSchema>;

export const CreateGuardianSchema = z.object({
  name: z.string().min(1, 'Guardian name is required').max(100),
  relationship: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']),
  phone: z.string().min(7, 'Valid phone number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  occupation: z.string().max(100).optional(),
  annualIncome: z.number().nonnegative().optional(),
  photoUrl: z.string().url('Must be a valid photo URL').optional(),
  sameAsStudentAddress: z.boolean().default(false),
  address: z.string().optional(),
  emergencyContacts: z.array(EmergencyContactSchema).default([]),
  status: z.enum(['ACTIVE', 'ARCHIVED']).default('ACTIVE'),
}).refine(
  (data) => data.sameAsStudentAddress || (data.address && data.address.trim().length > 0),
  {
    message: 'Address is required when sameAsStudentAddress is false',
    path: ['address'],
  }
);

export type CreateGuardianInput = z.infer<typeof CreateGuardianSchema>;

export const UpdateGuardianSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  relationship: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']).optional(),
  phone: z.string().min(7).optional(),
  email: z.string().email().optional().or(z.literal('')),
  occupation: z.string().max(100).optional(),
  annualIncome: z.number().nonnegative().optional(),
  photoUrl: z.string().url().optional(),
  sameAsStudentAddress: z.boolean().optional(),
  address: z.string().optional(),
  emergencyContacts: z.array(EmergencyContactSchema).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
});

export type UpdateGuardianInput = z.infer<typeof UpdateGuardianSchema>;

export const CreateStudentGuardianSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  guardianId: z.string().min(1, 'Guardian ID is required'),
  relationship: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']),
  isPrimaryGuardian: z.boolean().default(false),
  pickupPermission: z.boolean().default(true),
  emergencyContactPermission: z.boolean().default(true),
});

export type CreateStudentGuardianInput = z.infer<typeof CreateStudentGuardianSchema>;

export const UpdateStudentGuardianSchema = z.object({
  relationship: z.enum(['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']).optional(),
  isPrimaryGuardian: z.boolean().optional(),
  pickupPermission: z.boolean().optional(),
  emergencyContactPermission: z.boolean().optional(),
});

export type UpdateStudentGuardianInput = z.infer<typeof UpdateStudentGuardianSchema>;

export const CreateEnrollmentSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  academicSessionId: z.string().min(1, 'Academic Session ID is required'),
  classId: z.string().min(1, 'Class ID is required'),
  sectionId: z.string().min(1, 'Section ID is required'),
  rollNumber: z.number().int().positive().optional(), // Auto-generated if omitted
  enrollmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid enrollment date required').optional(),
  enrollmentStatus: z.enum([
    'ACTIVE',
    'PROMOTED',
    'TRANSFERRED',
    'WITHDRAWN',
    'COMPLETED',
    'ALUMNI',
    'ARCHIVED',
  ]).default('ACTIVE'),
  remarks: z.string().max(500).optional(),
});

export type CreateEnrollmentInput = z.infer<typeof CreateEnrollmentSchema>;

export const UpdateEnrollmentSchema = z.object({
  sectionId: z.string().min(1).optional(),
  rollNumber: z.number().int().positive().optional(),
  enrollmentStatus: z.enum([
    'ACTIVE',
    'PROMOTED',
    'TRANSFERRED',
    'WITHDRAWN',
    'COMPLETED',
    'ALUMNI',
    'ARCHIVED',
  ]).optional(),
  remarks: z.string().max(500).optional(),
});

export type UpdateEnrollmentInput = z.infer<typeof UpdateEnrollmentSchema>;

export const PromoteEnrollmentSchema = z.object({
  targetAcademicSessionId: z.string().min(1, 'Target Academic Session ID is required'),
  targetClassId: z.string().min(1, 'Target Class ID is required'),
  targetSectionId: z.string().min(1, 'Target Section ID is required'),
  rollNumber: z.number().int().positive().optional(),
  remarks: z.string().max(500).optional(),
});

export type PromoteEnrollmentInput = z.infer<typeof PromoteEnrollmentSchema>;

export const TransferEnrollmentSchema = z.object({
  transferDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid transfer date required').optional(),
  remarks: z.string().min(1, 'Transfer remarks or TC number is required').max(500),
});

export type TransferEnrollmentInput = z.infer<typeof TransferEnrollmentSchema>;

export const WithdrawEnrollmentSchema = z.object({
  withdrawDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Valid withdraw date required').optional(),
  remarks: z.string().min(1, 'Withdrawal reason is required').max(500),
});

export type WithdrawEnrollmentInput = z.infer<typeof WithdrawEnrollmentSchema>;
