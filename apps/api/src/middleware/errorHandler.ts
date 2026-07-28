import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ErrorCodes, ApiErrorDetail } from '@laps/shared';
import { sendError } from '../utils/response';
import { logger } from '../config/logger';
import { AppError } from '../utils/errors';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;
  // 1. Zod schema validation errors
  if (err instanceof z.ZodError) {
    const errors: ApiErrorDetail[] = err.errors.map((issue) => ({
      field: issue.path.join('.'),
      issue: issue.message,
    }));

    sendError(
      res,
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Request validation failed',
      errors,
    );
    return;
  }

  // 2. Domain / Application structured errors
  if (err instanceof AppError) {
    sendError(
      res,
      err.statusCode,
      err.errorCode,
      err.message,
      err.errors as ApiErrorDetail[] | undefined,
    );
    return;
  }

  // 3. CORS allowlist rejection error
  if (err instanceof Error && err.message.includes('CORS policy violation')) {
    sendError(res, 403, ErrorCodes.AUTH_SCOPE_FORBIDDEN, err.message);
    return;
  }

  // 3. Known error object
  if (err instanceof Error) {
    logger.error({ err, path: req.originalUrl }, '❌ Unhandled application exception');

    const message =
      process.env.NODE_ENV === 'production'
        ? 'An unexpected internal server error occurred.'
        : err.message;

    sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, message);
    return;
  }

  // 4. Unknown error type
  logger.error({ err, path: req.originalUrl }, '❌ Unknown server error thrown');
  sendError(
    res,
    500,
    ErrorCodes.INTERNAL_SERVER_ERROR,
    'An unexpected internal server error occurred.',
  );
}
