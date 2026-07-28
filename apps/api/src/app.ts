import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import {
  helmetMiddleware,
  corsMiddleware,
  mongoSanitizeMiddleware,
} from './middleware/security';
import { apiRateLimiter } from './middleware/rateLimiter';
import { requestLogger } from './middleware/requestLogger';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

export function createApp(): Express {
  const app = express();

  // 1. HTTP Security Headers
  app.use(helmetMiddleware);

  // 2. Cross-Origin Resource Sharing Allowlist
  app.use(corsMiddleware);

  // 3. Request Body Parsing with 10MB size limit
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 4. NoSQL Injection Sanitization
  app.use(mongoSanitizeMiddleware);

  // 5. API Rate Limiting
  app.use('/api/v1', apiRateLimiter);

  // 6. Correlation / Request ID and Structured Logging
  app.use(requestLogger);

  // 7. Mount Prefix-Versioned API v1 Routes
  app.use('/api/v1', routes);

  // 8. 404 Route Not Found Handler
  app.use(notFoundHandler);

  // 9. Centralized Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
