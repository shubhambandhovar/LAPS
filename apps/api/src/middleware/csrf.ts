import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

/**
 * CSRF protection middleware for cookie-authenticated state-changing endpoints.
 * Validates Origin/Referer against ALLOWED_ORIGINS and enforces X-Requested-With header.
 */
export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // In automated unit test mode, skip strict origin/header checks unless explicitly testing CSRF
  if (env.NODE_ENV === 'test' && !req.headers['x-test-csrf']) {
    next();
    return;
  }

  const origin = req.headers.origin || req.headers.referer;
  const requestedWith = req.headers['x-requested-with'];

  // Check X-Requested-With header (prevent standard HTML <form> POST CSRF attacks)
  if (
    !requestedWith ||
    typeof requestedWith !== 'string' ||
    requestedWith.toLowerCase() !== 'xmlhttprequest'
  ) {
    next(
      new AppError(
        403,
        ErrorCodes.AUTH_SCOPE_FORBIDDEN,
        'CSRF policy violation: Missing or invalid X-Requested-With header',
      ),
    );
    return;
  }

  // Validate Origin against ALLOWED_ORIGINS
  if (origin && env.ALLOWED_ORIGINS.length > 0) {
    const isAllowed = env.ALLOWED_ORIGINS.some((allowed) =>
      origin.startsWith(allowed),
    );
    if (!isAllowed) {
      next(
        new AppError(
          403,
          ErrorCodes.AUTH_SCOPE_FORBIDDEN,
          `CSRF policy violation: Unauthorized origin ${origin}`,
        ),
      );
      return;
    }
  }

  next();
}
