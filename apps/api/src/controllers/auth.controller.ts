import { Request, Response } from 'express';
import {
  LoginSchema,
  RevokeSessionSchema,
  ErrorCodes,
  PermissionRule,
} from '@laps/shared';
import { AuthService, toSafeAccount } from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
import { env } from '../config/env';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { Permission, IPermissionDocument } from '../models/Permission';

void Permission; // Ensure Mongoose registers the Permission model

const REFRESH_COOKIE_NAME = 'laps_refresh_token';

function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: env.JWT_REFRESH_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
}

export async function loginController(req: Request, res: Response): Promise<void> {
  const { identifier, password } = LoginSchema.parse(req.body);

  const result = await AuthService.login(
    identifier,
    password,
    req.headers['user-agent'],
    req.ip,
  );

  setRefreshCookie(res, result.refreshToken);

  sendSuccess(res, 200, 'Login successful', {
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
    sessionId: result.sessionId,
    sessionFamilyId: result.sessionFamilyId,
  });
}

export async function refreshController(req: Request, res: Response): Promise<void> {
  const cookieToken = req.cookies && req.cookies[REFRESH_COOKIE_NAME];
  if (!cookieToken) {
    throw new AppError(
      401,
      ErrorCodes.AUTH_SESSION_REVOKED,
      'No refresh token cookie provided',
    );
  }

  const result = await AuthService.refreshSession(
    cookieToken,
    req.headers['user-agent'],
    req.ip,
  );

  setRefreshCookie(res, result.refreshToken);

  sendSuccess(res, 200, 'Access token refreshed successfully', {
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
    sessionId: result.sessionId,
    sessionFamilyId: result.sessionFamilyId,
  });
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  const cookieToken = req.cookies && req.cookies[REFRESH_COOKIE_NAME];
  if (cookieToken) {
    await AuthService.logout(cookieToken);
  }

  clearRefreshCookie(res);
  sendSuccess(res, 200, 'Logged out successfully', null);
}

export async function logoutAllController(req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.id) {
    throw new AppError(
      401,
      ErrorCodes.AUTH_TOKEN_EXPIRED,
      'Authentication required to log out all sessions',
    );
  }

  await AuthService.logoutAll(req.user.id);
  clearRefreshCookie(res);
  sendSuccess(res, 200, 'All device sessions revoked successfully', null);
}

export async function getMeController(req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.id) {
    throw new AppError(
      401,
      ErrorCodes.AUTH_TOKEN_EXPIRED,
      'Authentication required',
    );
  }

  const user = await User.findById(req.user.id);
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError(
      401,
      ErrorCodes.AUTH_SESSION_REVOKED,
      'Account is inactive, suspended, or does not exist',
    );
  }

  const role = await Role.findOne({
    schoolId: user.schoolId,
    code: user.roleCode,
  }).populate<{ permissions: IPermissionDocument[] }>('permissions');

  const permissions: PermissionRule[] =
    role && role.permissions
      ? role.permissions.map((p) => ({
          module: p.module,
          action: p.action,
          resource: p.resource,
        }))
      : [];

  const account = toSafeAccount(user);
  account.permissions = permissions;

  sendSuccess(res, 200, 'User profile fetched successfully', {
    user: account,
    sessionId: req.user.sessionId,
    sessionFamilyId: req.user.sessionFamilyId,
  });
}

export async function getSessionsController(req: Request, res: Response): Promise<void> {
  if (!req.user || !req.user.id) {
    throw new AppError(
      401,
      ErrorCodes.AUTH_TOKEN_EXPIRED,
      'Authentication required',
    );
  }

  const sessions = await AuthService.listSessions(req.user.id, req.user.sessionId);
  sendSuccess(res, 200, 'Active sessions retrieved successfully', sessions);
}

export async function deleteSessionController(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user || !req.user.id) {
    throw new AppError(
      401,
      ErrorCodes.AUTH_TOKEN_EXPIRED,
      'Authentication required',
    );
  }

  const { sessionId } = RevokeSessionSchema.parse(req.params);
  await AuthService.revokeSession(req.user.id, sessionId);

  sendSuccess(res, 200, 'Device session revoked successfully', null);
}
