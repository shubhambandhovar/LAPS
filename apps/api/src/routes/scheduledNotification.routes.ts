import { Router, Request, Response, NextFunction } from 'express';
import {
  listScheduledNotifications,
  createScheduledNotification,
  cancelScheduledNotification,
} from '../controllers/scheduledNotification.controller';
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

router.get('/', requireCommAdmin, asyncHandler(listScheduledNotifications));
router.post('/', requireCommAdmin, asyncHandler(createScheduledNotification));
router.patch('/:id/cancel', requireCommAdmin, asyncHandler(cancelScheduledNotification));

export default router;
