import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { logger } from '../config/logger';

export interface RequestWithId extends Request {
  id?: string;
}

export function requestLogger(req: RequestWithId, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const requestId =
    (req.headers['x-request-id'] as string) ||
    (req.headers['x-correlation-id'] as string) ||
    `req-${crypto.randomUUID().slice(0, 8)}`;

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const logData = {
      requestId,
      method,
      route: originalUrl,
      statusCode,
      durationMs,
    };

    if (statusCode >= 500) {
      logger.error(logData, 'API Request Completed with Server Error');
    } else if (statusCode >= 400) {
      logger.warn(logData, 'API Request Completed with Client Error');
    } else {
      logger.info(logData, 'API Request Completed Successfully');
    }
  });

  next();
}
