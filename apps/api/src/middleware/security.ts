import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from '../config/env';

export const helmetMiddleware = helmet();

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin server requests)
    if (!origin) {
      return callback(null, true);
    }

    if (env.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS policy violation: Origin not allowed by ALLOWED_ORIGINS allowlist'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Correlation-Id'],
});

export const mongoSanitizeMiddleware = mongoSanitize({
  replaceWith: '_',
});
