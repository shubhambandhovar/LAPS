import dotenv from 'dotenv';
import path from 'path';
import { BackendEnvSchema, BackendEnv } from '@laps/shared';

// Load .env from root workspace or local directory
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config(); // fall back to current directory .env if present

export function validateEnv(envSource: Record<string, unknown> = process.env): BackendEnv {
  const sourceToValidate = {
    ...envSource,
    MONGODB_URI:
      envSource.MONGODB_URI ||
      (envSource.NODE_ENV === 'test' || process.env.NODE_ENV === 'test'
        ? 'mongodb://localhost:27017/laps_test'
        : undefined),
  };

  const result = BackendEnvSchema.safeParse(sourceToValidate);

  if (!result.success) {
    console.error('❌ FATAL: Invalid environment configuration!');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Environment validation failed: ' + result.error.message);
  }

  return result.data;
}

export const env = validateEnv();
