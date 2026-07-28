import { Response } from 'express';
import { ApiResponse, ApiErrorResponse, PaginationMeta, ApiErrorDetail } from '@laps/shared';
import { RequestWithId } from '../middleware/requestLogger';

export function sendSuccess<T = unknown>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  pagination?: PaginationMeta,
): void {
  const req = res.req as RequestWithId;
  const payload: ApiResponse<T> = {
    success: true,
    statusCode,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req?.id,
      path: req?.originalUrl,
    },
  };

  if (pagination) {
    payload.pagination = pagination;
  }

  res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  errorCode: string,
  message: string,
  errors?: ApiErrorDetail[],
): void {
  const req = res.req as RequestWithId;
  const payload: ApiErrorResponse = {
    success: false,
    statusCode,
    errorCode,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req?.id,
      path: req?.originalUrl,
    },
  };

  if (errors && errors.length > 0) {
    payload.errors = errors;
  }

  res.status(statusCode).json(payload);
}
