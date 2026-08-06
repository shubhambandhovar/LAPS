import { Router, Request, Response, NextFunction } from 'express';
import {
  loginController,
  refreshController,
  logoutController,
  logoutAllController,
  getMeController,
  getSessionsController,
  deleteSessionController,
  changePasswordController,
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import {
  loginAccountLimiter,
  loginIpAbuseLimiter,
  refreshLimiter,
} from '../middleware/authRateLimiter';

import { requirePermission } from '../middleware/rbac';
import { sendSuccess } from '../utils/response';
import { env } from '../config/env';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

// Public authentication endpoints with layered rate limiters and CSRF protection where state-changing
router.post(
  '/login',
  loginIpAbuseLimiter,
  loginAccountLimiter,
  asyncHandler(loginController),
);

router.post(
  '/refresh',
  refreshLimiter,
  csrfProtection,
  asyncHandler(refreshController),
);

router.post('/logout', csrfProtection, asyncHandler(logoutController));

// Authenticated session & account security endpoints
router.post(
  '/change-password',
  authenticate,
  csrfProtection,
  asyncHandler(changePasswordController),
);

router.post(
  '/logout-all',
  authenticate,
  csrfProtection,
  asyncHandler(logoutAllController),
);

router.get('/me', authenticate, asyncHandler(getMeController));

router.get('/sessions', authenticate, asyncHandler(getSessionsController));

router.delete(
  '/sessions/:sessionId',
  authenticate,
  csrfProtection,
  asyncHandler(deleteSessionController),
);

// Test-only endpoint for automated RBAC verification suite
if (env.NODE_ENV === 'test') {
  router.get(
    '/test-rbac/student',
    authenticate,
    requirePermission('STUDENT', 'READ', 'student'),
    (_req: Request, res: Response) => {
      sendSuccess(res, 200, 'Authorized access to student records', { ok: true });
    },
  );
}

export default router;
