import { describe, it, expect } from 'vitest';
import { validateEnv } from '../config/env';

describe('Environment Validation', () => {
  it('should successfully validate a complete and valid environment object', () => {
    const validEnv = {
      NODE_ENV: 'test',
      PORT: '5000',
      MONGODB_URI: 'mongodb://localhost:27017/laps_test',
      API_BASE_URL: 'http://localhost:5000/api/v1',
      FRONTEND_ORIGIN: 'http://localhost:5173',
      ALLOWED_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
      LOG_LEVEL: 'info',
    };

    const parsed = validateEnv(validEnv);
    expect(parsed.PORT).toBe(5000);
    expect(parsed.ALLOWED_ORIGINS).toEqual(['http://localhost:5173', 'http://127.0.0.1:5173']);
  });

  it('should throw an error when required MONGODB_URI is missing or invalid', () => {
    const invalidEnv = {
      NODE_ENV: 'test',
      PORT: '5000',
      MONGODB_URI: 'invalid-uri',
    };

    expect(() => validateEnv(invalidEnv)).toThrow(/Environment validation failed/);
  });
});
