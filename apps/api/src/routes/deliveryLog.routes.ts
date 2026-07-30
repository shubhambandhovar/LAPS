import { Router, Request, Response, NextFunction } from 'express';
import {
  listDeliveryLogs,
  getDeliveryStats,
  retryFailedDelivery,
} from '../controllers/deliveryLog.controller';
import { authenticate } from '../middleware/auth';
import { requireCommAdmin } from '../middleware/communicationRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireCommAdmin, asyncHandler(listDeliveryLogs));
router.get('/stats', requireCommAdmin, asyncHandler(getDeliveryStats));
router.post('/:id/retry', requireCommAdmin, asyncHandler(retryFailedDelivery));

export default router;
