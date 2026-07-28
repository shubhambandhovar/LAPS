import { Request, Response } from 'express';
import { ErrorCodes } from '@laps/shared';
import { sendError } from '../utils/response';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(
    res,
    404,
    ErrorCodes.RESOURCE_NOT_FOUND,
    `Route not found: ${req.method} ${req.originalUrl}`,
  );
}
