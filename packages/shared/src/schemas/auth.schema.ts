import { z } from 'zod';

/**
 * LoginSchema — validates input presence and reasonable bounds for login.
 * Does NOT enforce NIST policy rules so generic "Invalid credentials" can be returned cleanly.
 */
export const LoginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Username or email is required')
    .max(255)
    .transform((val) => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(128, 'Password exceeds maximum allowed length'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * PasswordPolicySchema — System password policy per NIST SP 800-63B guidelines.
 * Requires a minimum length of 10 characters and max 128 characters.
 * Prioritizes length over arbitrary composition rules.
 */
export const PasswordPolicySchema = z
  .string()
  .min(10, 'Password must be at least 10 characters long per NIST guidelines')
  .max(128, 'Password cannot exceed 128 characters');

export const CreatePasswordSchema = z
  .object({
    password: PasswordPolicySchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type CreatePasswordInput = z.infer<typeof CreatePasswordSchema>;

export const RevokeSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

export type RevokeSessionInput = z.infer<typeof RevokeSessionSchema>;
