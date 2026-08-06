import { z } from 'zod';
import { DocumentType } from './document.schema';

export enum SignatureType {
  SIGNATURE = 'SIGNATURE',
  SEAL = 'SEAL',
  STAMP = 'STAMP',
}

export const UserSignatureSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().optional(),
  userId: z.string(), // ID of the User
  name: z.string(), // Display name for the signature (e.g. "Primary Signature")
  designation: z.string(), // e.g. "Principal", "Exam Controller"
  type: z.nativeEnum(SignatureType).default(SignatureType.SIGNATURE),
  imageUrl: z.string(), // Base64 or URL of transparent PNG
  isActive: z.boolean().default(true),
  validFrom: z.date().optional(),
  validUntil: z.date().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserSignature = z.infer<typeof UserSignatureSchema>;

export const ApprovalWorkflowSchema = z.object({
  id: z.string().optional(),
  schoolId: z.string().optional(),
  name: z.string(),
  documentType: z.nativeEnum(DocumentType),
  requiredRoles: z.array(z.string()), // e.g. ['CLASS_TEACHER', 'PRINCIPAL']
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type ApprovalWorkflow = z.infer<typeof ApprovalWorkflowSchema>;
