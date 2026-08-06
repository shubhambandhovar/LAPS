import { z } from 'zod';

export enum IdCardUserType {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  EMPLOYEE = 'EMPLOYEE',
  GUARDIAN = 'GUARDIAN',
  VISITOR = 'VISITOR',
}

export enum IdCardLayoutType {
  LANDSCAPE = 'LANDSCAPE',
  PORTRAIT = 'PORTRAIT',
  PVC = 'PVC', // Standard CR80 Size
}

export enum IdCardStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  LOST = 'LOST',
  REPLACED = 'REPLACED',
  ARCHIVED = 'ARCHIVED',
}

export enum CardElementType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  QR = 'QR',
  BARCODE = 'BARCODE',
  SHAPE = 'SHAPE',
}

export const CardElementSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(CardElementType),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  
  // Type-specific fields
  value: z.string().optional(), // Text content or Image URL. Can contain bindings e.g. {{student.name}}
  
  // Styling
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidth: z.number().optional(),
  borderRadius: z.number().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  zIndex: z.number().optional(),
});

export type CardElement = z.infer<typeof CardElementSchema>;

export const IdCardTemplateSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().optional(),
  name: z.string().min(1, 'Template name is required'),
  targetUserType: z.nativeEnum(IdCardUserType),
  layoutType: z.nativeEnum(IdCardLayoutType),
  isDefault: z.boolean().default(false),
  
  // Dimensions in pixels or generic units mapped by frontend
  width: z.number(),
  height: z.number(),
  
  // Global Styling
  backgroundColor: z.string().optional(),
  backgroundImageUrl: z.string().optional(),
  
  // Design Arrays
  frontElements: z.array(CardElementSchema).default([]),
  backElements: z.array(CardElementSchema).default([]),
  
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type IdCardTemplate = z.infer<typeof IdCardTemplateSchema>;

export const IdCardRecordSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().optional(),
  referenceId: z.string(), // ID of the Student/Teacher/Employee/Visitor
  userType: z.nativeEnum(IdCardUserType),
  templateId: z.string(),
  
  status: z.nativeEnum(IdCardStatus).default(IdCardStatus.ACTIVE),
  issueDate: z.date(),
  expiryDate: z.date().optional(),
  
  qrCodeToken: z.string().optional(), // References the QrCode model's secure token
  
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type IdCardRecord = z.infer<typeof IdCardRecordSchema>;

// Request Schemas
export const GenerateIdCardRequestSchema = z.object({
  referenceId: z.string(),
  userType: z.nativeEnum(IdCardUserType),
  templateId: z.string().optional(), // If omitted, uses default template for userType
  expiryDate: z.string().datetime().optional(),
});

export type GenerateIdCardRequest = z.infer<typeof GenerateIdCardRequestSchema>;

export const BulkGenerateIdCardRequestSchema = z.object({
  requests: z.array(GenerateIdCardRequestSchema),
});

export type BulkGenerateIdCardRequest = z.infer<typeof BulkGenerateIdCardRequestSchema>;

export const BulkActionRequestSchema = z.object({
  cardIds: z.array(z.string()),
  action: z.enum(['REVOKE', 'ARCHIVE', 'RENEW']),
  newExpiryDate: z.string().datetime().optional(), // only for RENEW
});

export type BulkActionRequest = z.infer<typeof BulkActionRequestSchema>;
