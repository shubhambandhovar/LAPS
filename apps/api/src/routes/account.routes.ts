import { Router, Request, Response, NextFunction } from 'express';
import {
  generateAccountController,
  generateBulkAccountController,
  resetPasswordController,
  regenerateUsernameController,
  updateAccountStatusController,
  listAccountsController,
  getAccountByIdController,
  getLoginHistoryController,
} from '../controllers/account.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);
router.use(
  requireRole([
    'SUPER_ADMIN',
    'SCHOOL_ADMIN',
    'ADMIN',
    'HR_MANAGER',
    'PRINCIPAL',
  ]),
);

router.get('/', asyncHandler(listAccountsController));
router.get('/login-history', asyncHandler(getLoginHistoryController));
router.get('/:id', asyncHandler(getAccountByIdController));

router.post('/generate', csrfProtection, asyncHandler(generateAccountController));
router.post('/generate-bulk', csrfProtection, asyncHandler(generateBulkAccountController));
router.post('/reset-password', csrfProtection, asyncHandler(resetPasswordController));
router.post('/regenerate', csrfProtection, asyncHandler(regenerateUsernameController));
router.patch('/status', csrfProtection, asyncHandler(updateAccountStatusController));

export default router;
