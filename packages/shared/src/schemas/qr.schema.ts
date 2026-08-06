import { z } from 'zod';

export enum QrType {
  STUDENT_ID = 'STUDENT_ID',
  TEACHER_ID = 'TEACHER_ID',
  EMPLOYEE_ID = 'EMPLOYEE_ID',
  GUARDIAN_CARD = 'GUARDIAN_CARD',
  VISITOR_PASS = 'VISITOR_PASS',
  LIBRARY_BOOK = 'LIBRARY_BOOK',
  BOOK_ISSUE = 'BOOK_ISSUE',
  FEE_RECEIPT = 'FEE_RECEIPT',
  TRANSPORT = 'TRANSPORT',
  EVENT_PASS = 'EVENT_PASS',
  CERTIFICATE = 'CERTIFICATE',
  ASSET = 'ASSET',
}

export enum QrStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum QrScanResult {
  SUCCESS = 'SUCCESS',
  FORBIDDEN = 'FORBIDDEN',
  INVALID = 'INVALID',
  EXPIRED = 'EXPIRED',
}

export const QrCodeSchema = z.object({
  id: z.string().optional(),
  qrType: z.nativeEnum(QrType),
  referenceId: z.string(), // MongoDB ObjectId string
  secureToken: z.string(), // 64-char hex string
  status: z.nativeEnum(QrStatus),
  expiresAt: z.date().optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type QrCode = z.infer<typeof QrCodeSchema>;

export const QrScanLogSchema = z.object({
  id: z.string().optional(),
  qrCodeId: z.string(),
  scannedBy: z.string(), // User ID
  action: z.string(), // e.g. PROFILE_VIEW, BOOK_ISSUE, TRANSPORT_BOARDING
  result: z.nativeEnum(QrScanResult),
  deviceInfo: z.string().optional(),
  ipAddress: z.string().optional(),
  scannedAt: z.date().optional(),
});

export type QrScanLog = z.infer<typeof QrScanLogSchema>;

// API request schemas
export const GenerateQrRequestSchema = z.object({
  qrType: z.nativeEnum(QrType),
  referenceId: z.string(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

export type GenerateQrRequest = z.infer<typeof GenerateQrRequestSchema>;

export const VerifyQrRequestSchema = z.object({
  secureToken: z.string(),
  action: z.string(),
  deviceInfo: z.string().optional(),
});

export type VerifyQrRequest = z.infer<typeof VerifyQrRequestSchema>;

// Verified Qr Response Payload (What the UI receives after successful scan)
export const VerifiedQrResponseSchema = z.object({
  valid: z.boolean(),
  qrType: z.nativeEnum(QrType).optional(),
  referenceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  message: z.string(),
  entity: z.record(z.any()).optional(), // The resolved Student, Asset, etc.
});

export type VerifiedQrResponse = z.infer<typeof VerifiedQrResponseSchema>;
