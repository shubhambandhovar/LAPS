import { Router, Request, Response, NextFunction } from 'express';
import {
  getWorkingDayRules,
  upsertWorkingDayRule,
  archiveWorkingDayRule,
} from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth';
import {
  requireAcademicRead,
  requireAcademicWrite,
} from '../middleware/academicRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireAcademicRead, asyncHandler(getWorkingDayRules));
router.put('/', requireAcademicWrite, asyncHandler(upsertWorkingDayRule));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveWorkingDayRule),
);

export default router;
