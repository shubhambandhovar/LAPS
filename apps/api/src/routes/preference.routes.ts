import { Router, Request, Response, NextFunction } from 'express';
import {
  getMyPreferences,
  updateMyPreferences,
  getUserPreferences,
} from '../controllers/preference.controller';
import { authenticate } from '../middleware/auth';
import {
  enforceSelfServiceNotificationScope,
  requireCommAdmin,
} from '../middleware/communicationRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/my', asyncHandler(getMyPreferences));
router.put('/my', asyncHandler(updateMyPreferences));
router.patch('/my', asyncHandler(updateMyPreferences));
router.get('/:userId', requireCommAdmin, enforceSelfServiceNotificationScope, asyncHandler(getUserPreferences));

export default router;
