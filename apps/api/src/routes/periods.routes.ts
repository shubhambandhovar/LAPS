import { Router, Request, Response, NextFunction } from 'express';
import {
  getTimetablePeriods,
  getTimetablePeriodById,
  createTimetablePeriod,
  updateTimetablePeriod,
  archiveTimetablePeriod,
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

router.get('/', requireAcademicRead, asyncHandler(getTimetablePeriods));
router.post('/', requireAcademicWrite, asyncHandler(createTimetablePeriod));
router.get('/:id', requireAcademicRead, asyncHandler(getTimetablePeriodById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateTimetablePeriod));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveTimetablePeriod),
);

export default router;
