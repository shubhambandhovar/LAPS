import { Request, Response, NextFunction } from 'express';
import { ErrorCodes } from '@laps/shared';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { User } from '../models/User';

/**
 * Express middleware to authenticate Bearer JWT access token and attach safe user context to req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Authentication required: Missing Bearer token',
      );
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError(
        401,
        ErrorCodes.AUTH_TOKEN_EXPIRED,
        'Access token expired or signature invalid',
      );
    }

    const user = await User.findById(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(
        401,
        ErrorCodes.AUTH_SESSION_REVOKED,
        'Account is inactive, suspended, or does not exist',
      );
    }

    req.user = {
      id: user._id.toString(),
      schoolId: user.schoolId,
      identifier: user.identifier,
      role: user.roleCode,
      userType: user.userType,
      profileRef: user.profileRef?.toString(),
      sessionId: payload.sessionId,
      sessionFamilyId: payload.sessionFamilyId,
    };

    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'Access denied'));
    }
    next();
  };
}
