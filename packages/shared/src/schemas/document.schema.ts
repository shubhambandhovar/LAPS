import { z } from 'zod';

export enum DocumentType {
  // Students
  BONAFIDE = 'BONAFIDE',
  TRANSFER_CERTIFICATE = 'TRANSFER_CERTIFICATE',
  CHARACTER_CERTIFICATE = 'CHARACTER_CERTIFICATE',
  MIGRATION_CERTIFICATE = 'MIGRATION_CERTIFICATE',
  MARKSHEET = 'MARKSHEET',
  PROGRESS_REPORT = 'PROGRESS_REPORT',
  ADMIT_CARD = 'ADMIT_CARD',
  
  // Finance
  FEE_RECEIPT = 'FEE_RECEIPT',
  FEE_CLEARANCE = 'FEE_CLEARANCE',
  
  // Employees
  EXPERIENCE_CERTIFICATE = 'EXPERIENCE_CERTIFICATE',
  EMPLOYMENT_CERTIFICATE = 'EMPLOYMENT_CERTIFICATE',
  SALARY_CERTIFICATE = 'SALARY_CERTIFICATE',
  APPOINTMENT_LETTER = 'APPOINTMENT_LETTER',
  JOINING_LETTER = 'JOINING_LETTER',
  RELIEVING_LETTER = 'RELIEVING_LETTER',
  
  // Other
  LIBRARY_CLEARANCE = 'LIBRARY_CLEARANCE',
  NO_DUES = 'NO_DUES',
  TRANSPORT_PASS = 'TRANSPORT_PASS',
  MEDICAL_CERTIFICATE = 'MEDICAL_CERTIFICATE',
  CUSTOM = 'CUSTOM',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  GENERATED = 'GENERATED',
  SIGNED = 'SIGNED',
  ISSUED = 'ISSUED',
  REVOKED = 'REVOKED',
  ARCHIVED = 'ARCHIVED',
}

export enum DocumentLayoutType {
  A4_PORTRAIT = 'A4_PORTRAIT', // 210 x 297 mm
  A4_LANDSCAPE = 'A4_LANDSCAPE', // 297 x 210 mm
  LETTER_PORTRAIT = 'LETTER_PORTRAIT', // 8.5 x 11 in
  LEGAL_PORTRAIT = 'LEGAL_PORTRAIT', // 8.5 x 14 in
  CUSTOM = 'CUSTOM',
}

export enum DocumentElementType {
  TEXT = 'TEXT', // Rich text block with variable substitution
  IMAGE = 'IMAGE', // Logo, Photo
  QR = 'QR',
  BARCODE = 'BARCODE',
  TABLE = 'TABLE', // Fixed tables like marks or fee breakdown
  SHAPE = 'SHAPE', // Lines, borders, rectangles
  SIGNATURE_PLACEHOLDER = 'SIGNATURE_PLACEHOLDER', // Placeholder for digital signatures
}

export const DocumentElementSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(DocumentElementType),
  
  // Positioning (in mm for accurate printing mapping)
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  
  // Content
  value: z.string().optional(), // HTML/Text with placeholders like {{student.name}}
  
  // Styling
  fontSize: z.number().optional(), // in pt
  fontFamily: z.string().optional(),
  fontWeight: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(), // in mm
  borderRadius: z.number().optional(), // in mm
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  zIndex: z.number().optional(),
});

export type DocumentElement = z.infer<typeof DocumentElementSchema>;

export const DocumentTemplateSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().optional(),
  name: z.string().min(1, 'Template name is required'),
  documentType: z.nativeEnum(DocumentType),
  layoutType: z.nativeEnum(DocumentLayoutType),
  
  // Dimensions in mm
  width: z.number(),
  height: z.number(),
  
  // Global Styling
  backgroundColor: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  watermarkUrl: z.string().optional(),
  
  elements: z.array(DocumentElementSchema).default([]),
  
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type DocumentTemplate = z.infer<typeof DocumentTemplateSchema>;

export const DocumentRecordSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().optional(),
  
  serialNumber: z.string(), // e.g. BON-2026-000001
  
  documentType: z.nativeEnum(DocumentType),
  templateId: z.string(),
  workflowId: z.string().optional(),
  
  referenceId: z.string(), // ID of the Student/Employee
  referenceModel: z.enum(['Student', 'Teacher', 'Employee']), // Polymorphic relation hint
  
  status: z.nativeEnum(DocumentStatus).default(DocumentStatus.ISSUED),
  
  issuedDate: z.date().optional(),
  expiryDate: z.date().optional(),
  
  qrCodeToken: z.string().optional(), // Token for QR Verification
  
  generatedBy: z.string().optional(), // User ID who generated it
  
  version: z.number().default(1),
  signatures: z.array(z.object({
    userId: z.string(),
    signatureId: z.string(),
    role: z.string(),
    timestamp: z.date(),
    ipAddress: z.string().optional(),
  })).default([]),
  
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type DocumentRecord = z.infer<typeof DocumentRecordSchema>;

// Requests
export const GenerateDocumentRequestSchema = z.object({
  referenceId: z.string(),
  referenceModel: z.enum(['Student', 'Teacher', 'Employee']),
  documentType: z.nativeEnum(DocumentType),
  templateId: z.string(), // required, we don't assume default for documents, or maybe we do
});

export type GenerateDocumentRequest = z.infer<typeof GenerateDocumentRequestSchema>;
