import { z } from 'zod';

export const BackendEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().refine(
    (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
    { message: 'MONGODB_URI must start with mongodb:// or mongodb+srv://' },
  ),
  API_BASE_URL: z.string().url().default('http://localhost:5000/api/v1'),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:5173,http://127.0.0.1:5173')
    .transform((val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters')
    .default('dev_laps_access_secret_key_1234567890'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters')
    .default('dev_laps_refresh_secret_key_0987654321'),
  JWT_ACCESS_EXPIRES_IN: z.coerce.number().int().positive().default(900), // 15 min default
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7), // 7 days default
  SUPER_ADMIN_IDENTIFIER: z.string().default('admin@littleangelsschool.edu.in'),
  SUPER_ADMIN_PASSWORD_SEED: z.string().default('DevelopmentAdmin10!'),
});

export type BackendEnv = z.infer<typeof BackendEnvSchema>;
