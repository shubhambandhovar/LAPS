import jwt from 'jsonwebtoken';
import { UserRoleCode } from '@laps/shared';
import { env } from '../config/env';
import { IUserDocument } from '../models/User';

export interface AccessTokenPayload {
  sub: string;
  schoolId: string;
  identifier: string;
  role: UserRoleCode;
  userType: UserRoleCode;
  sessionId: string;
  sessionFamilyId: string;
  iat?: number;
  exp?: number;
}

/**
 * Issue a short-lived Access JWT (~15 minutes).
 */
export function generateAccessToken(
  user: IUserDocument,
  sessionId: string,
  sessionFamilyId: string,
): string {
  const payload: AccessTokenPayload = {
    sub: user._id.toString(),
    schoolId: user.schoolId,
    identifier: user.identifier,
    role: user.roleCode,
    userType: user.userType,
    sessionId,
    sessionFamilyId,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

/**
 * Verify and decode Access JWT.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}
