import { Router, Request, Response, NextFunction } from 'express';
import {
  getBellSchedules,
  getBellScheduleById,
  createBellSchedule,
  updateBellSchedule,
  archiveBellSchedule,
} from '../controllers/bellSchedule.controller';
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

router.get('/', requireAcademicRead, asyncHandler(getBellSchedules));
router.post('/', requireAcademicWrite, asyncHandler(createBellSchedule));
router.get('/:id', requireAcademicRead, asyncHandler(getBellScheduleById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateBellSchedule));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveBellSchedule),
);

export default router;
