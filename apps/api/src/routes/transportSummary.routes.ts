import { Router, Request, Response, NextFunction } from 'express';
import {
  getTransportSummary,
  recalculateTransportSummary,
} from '../controllers/transportSummary.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get(
  '/',
  requirePermission('transport', 'read', 'summary'),
  asyncHandler(getTransportSummary),
);

router.post(
  '/recalculate',
  requirePermission('transport', 'update', 'summary'),
  asyncHandler(recalculateTransportSummary),
);

export default router;
