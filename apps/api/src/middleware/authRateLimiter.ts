import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ErrorCodes } from '@laps/shared';
import { sendError } from '../utils/response';
import { env } from '../config/env';

/**
 * 1. Account-level Login Limiter — Keyed by normalized identifier + IP.
 * Max 5 login attempts per 15 minutes to prevent targeted account brute-forcing
 * without locking out other users sharing the same school NAT/IP.
 */
export const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) =>
    env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
  keyGenerator: (req: Request) => {
    const id =
      req.body && typeof req.body.identifier === 'string'
        ? req.body.identifier.trim().toLowerCase()
        : 'unknown_user';
    return `${id}_${req.ip || '0.0.0.0'}`;
  },
  handler: (req: Request, res: Response) => {
    void req;
    sendError(
      res,
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Too many login attempts for this account from your IP. Please try again after 15 minutes.',
    );
  },
});

/**
 * 2. IP Abuse Limiter — Keyed by IP address with a higher threshold (100 / 15m).
 * Protects against automated network flood while allowing multiple teachers/students
 * on the school network to log in simultaneously.
 */
export const loginIpAbuseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) =>
    env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
  handler: (req: Request, res: Response) => {
    void req;
    sendError(
      res,
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Too many authentication requests from this network. Please try again later.',
    );
  },
});

/**
 * 3. Dedicated Refresh Limiter — Keyed by IP for /api/v1/auth/refresh (max 60 / 15m).
 */
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) =>
    env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
  handler: (req: Request, res: Response) => {
    void req;
    sendError(
      res,
      429,
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      'Too many token refresh requests. Please wait a moment.',
    );
  },
});
