import crypto from 'node:crypto';
import { ErrorCodes, UserAccount, RefreshSessionInfo } from '@laps/shared';
import { User, IUserDocument } from '../models/User';
import { RefreshSession } from '../models/RefreshSession';
import {
  verifyPassword,
  hashRefreshToken,
  generateRefreshToken,
  parseUserAgent,
} from '../utils/crypto';
import { generateAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { logger } from '../config/logger';

export function toSafeAccount(user: IUserDocument): UserAccount {
  return {
    id: user._id.toString(),
    schoolId: user.schoolId,
    identifier: user.identifier,
    email: user.email,
    phone: user.phone,
    role: user.roleCode,
    userType: user.userType,
    profileRef: user.profileRef?.toString(),
    status: user.status,
    lastLoginAt: user.lastLoginAt?.toISOString(),
  };
}

export class AuthService {
  /**
   * Login with username/email and password.
   * Returns generic "Invalid credentials" error on any authentication failure per NIST rules.
   */
  public static async login(
    identifier: string,
    passwordPlain: string,
    userAgentHeader?: string,
    ip?: string,
  ) {
    const normalizedId = identifier.trim().toLowerCase();

    const user = await User.findOne({
      schoolId: 'LAPS-GOHAD',
      identifier: normalizedId,
    }).select('+passwordHash');

    if (!user || user.status !== 'ACTIVE') {
      logger.warn({ identifier: normalizedId, ip }, 'Login failed: Account not found or inactive');
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Invalid credentials');
    }

    const isMatch = await verifyPassword(passwordPlain, user.passwordHash);
    if (!isMatch) {
      logger.warn({ identifier: normalizedId, ip }, 'Login failed: Password mismatch');
      throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Invalid credentials');
    }

    // Create an independent Session Family for this device login
    const sessionFamilyId = crypto.randomUUID();
    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const userAgent = parseUserAgent(userAgentHeader);

    const expiresAt = new Date(
      Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    );

    const session = await RefreshSession.create({
      userId: user._id,
      sessionFamilyId,
      tokenHash,
      userAgent,
      ip: ip || '0.0.0.0',
      isRevoked: false,
      lastUsedAt: new Date(),
      expiresAt,
    });

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });

    const accessToken = generateAccessToken(
      user,
      session._id.toString(),
      sessionFamilyId,
    );

    logger.info(
      { userId: user._id, role: user.roleCode, sessionFamilyId, ip },
      'SUCCESS: User logged in',
    );

    return {
      user: toSafeAccount(user),
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      sessionId: session._id.toString(),
      sessionFamilyId,
    };
  }

  /**
   * Rotate Refresh Token within the same Session Family.
   * Detects reuse of revoked tokens and revokes ONLY the affected session family.
   */
  public static async refreshSession(
    rawRefreshToken: string,
    userAgentHeader?: string,
    ip?: string,
  ) {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const session = await RefreshSession.findOne({ tokenHash });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError(
        401,
        ErrorCodes.AUTH_SESSION_REVOKED,
        'Invalid or expired refresh session',
      );
    }

    // TARGETED FAMILY REVOCATION ON REUSE DETECTION
    if (session.isRevoked) {
      // Check concurrency grace window (10 seconds) to avoid false-positive revocation on rapid double-requests
      const now = Date.now();
      const revokedAtMs = session.revokedAt ? session.revokedAt.getTime() : 0;
      const isWithinGraceWindow = now - revokedAtMs < 10000;

      if (!isWithinGraceWindow) {
        logger.warn(
          {
            userId: session.userId,
            sessionFamilyId: session.sessionFamilyId,
            ip,
          },
          '🚨 SUSPICIOUS_REFRESH_REUSE detected — revoking affected session family!',
        );

        await RefreshSession.updateMany(
          { sessionFamilyId: session.sessionFamilyId },
          { $set: { isRevoked: true, revokedAt: new Date() } },
        );
      }

      throw new AppError(
        401,
        ErrorCodes.AUTH_SESSION_REVOKED,
        'Session revoked due to security policy',
      );
    }

    const user = await User.findById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError(
        401,
        ErrorCodes.AUTH_SESSION_REVOKED,
        'Account inactive or suspended',
      );
    }

    // Mark previous session token as revoked (rotation)
    session.isRevoked = true;
    session.revokedAt = new Date();
    await session.save();

    // Issue new token in the same session family
    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashRefreshToken(newRawRefreshToken);
    const userAgent = parseUserAgent(userAgentHeader);

    const expiresAt = new Date(
      Date.now() + env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    );

    const newSession = await RefreshSession.create({
      userId: user._id,
      sessionFamilyId: session.sessionFamilyId,
      tokenHash: newTokenHash,
      userAgent,
      ip: ip || '0.0.0.0',
      isRevoked: false,
      lastUsedAt: new Date(),
      expiresAt,
    });

    const accessToken = generateAccessToken(
      user,
      newSession._id.toString(),
      session.sessionFamilyId,
    );

    logger.debug(
      { userId: user._id, sessionFamilyId: session.sessionFamilyId },
      'Refresh token rotated successfully',
    );

    return {
      user: toSafeAccount(user),
      accessToken,
      refreshToken: newRawRefreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      sessionId: newSession._id.toString(),
      sessionFamilyId: session.sessionFamilyId,
    };
  }

  /**
   * Log out current session family.
   */
  public static async logout(rawRefreshToken: string) {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const session = await RefreshSession.findOne({ tokenHash });

    if (session && !session.isRevoked) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      await session.save();
      logger.info(
        { userId: session.userId, sessionFamilyId: session.sessionFamilyId },
        'User logged out of session',
      );
    }
  }

  /**
   * Log out all devices/sessions for a user account.
   */
  public static async logoutAll(userId: string) {
    const res = await RefreshSession.updateMany(
      { userId, isRevoked: false },
      { $set: { isRevoked: true, revokedAt: new Date() } },
    );

    logger.info({ userId, modifiedCount: res.modifiedCount }, 'USER_LOGOUT_ALL executed');
  }

  /**
   * List active sessions for the current user.
   */
  public static async listSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<RefreshSessionInfo[]> {
    const sessions = await RefreshSession.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ lastUsedAt: -1 });

    return sessions.map((sess) => ({
      id: sess._id.toString(),
      sessionFamilyId: sess.sessionFamilyId,
      deviceInfo: sess.userAgent,
      ipAddress: sess.ip,
      userAgent: sess.userAgent,
      createdAt: sess.createdAt.toISOString(),
      lastUsedAt: sess.lastUsedAt?.toISOString(),
      isCurrent: sess._id.toString() === currentSessionId,
    }));
  }

  /**
   * Revoke a specific session. Enforces IDOR protection.
   */
  public static async revokeSession(userId: string, sessionId: string) {
    const session = await RefreshSession.findById(sessionId);

    if (!session || session.userId.toString() !== userId) {
      logger.warn(
        { userId, attemptedSessionId: sessionId },
        '🚨 IDOR block: Attempt to revoke another user session',
      );
      throw new AppError(
        403,
        ErrorCodes.AUTH_SCOPE_FORBIDDEN,
        'User is not authorized to revoke this session',
      );
    }

    if (!session.isRevoked) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      await session.save();
      logger.info(
        { userId, sessionFamilyId: session.sessionFamilyId },
        'Remote session revoked by user',
      );
    }
  }
}
