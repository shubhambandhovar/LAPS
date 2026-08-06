import { z } from 'zod';

export const generateAccountSchema = z.object({
  entityType: z.enum(['STUDENT', 'TEACHER', 'EMPLOYEE']),
  entityId: z.string().min(1, 'Entity ID is required'),
  sendNotification: z.boolean().optional().default(true),
  customPrefix: z.string().optional(),
});
export type GenerateAccountInput = z.infer<typeof generateAccountSchema>;

export const generateBulkAccountSchema = z.object({
  entityType: z.enum(['STUDENT', 'TEACHER', 'EMPLOYEE']),
  entityIds: z.array(z.string().min(1)).min(1, 'At least one entity ID is required'),
  sendNotification: z.boolean().optional().default(true),
  customPrefix: z.string().optional(),
});
export type GenerateBulkAccountInput = z.infer<typeof generateBulkAccountSchema>;

export const resetPasswordSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  sendNotification: z.boolean().optional().default(true),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const regenerateUsernameSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  customUsername: z.string().min(3, 'Username must be at least 3 characters').optional(),
});
export type RegenerateUsernameInput = z.infer<typeof regenerateUsernameSchema>;

export const updateAccountStatusSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  status: z.enum([
    'PENDING',
    'ACTIVE',
    'LOCKED',
    'DISABLED',
    'PASSWORD_RESET_REQUIRED',
    'SUSPENDED',
    'INACTIVE',
  ]),
  reason: z.string().optional(),
});
export type UpdateAccountStatusInput = z.infer<typeof updateAccountStatusSchema>;

export const firstLoginPasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(12, 'Password must be at least 12 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
  });
export type FirstLoginPasswordChangeInput = z.infer<typeof firstLoginPasswordChangeSchema>;
