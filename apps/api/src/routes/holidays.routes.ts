import { Router, Request, Response, NextFunction } from 'express';
import {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  archiveHoliday,
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

router.get('/', requireAcademicRead, asyncHandler(getHolidays));
router.post('/', requireAcademicWrite, asyncHandler(createHoliday));
router.get('/:id', requireAcademicRead, asyncHandler(getHolidayById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateHoliday));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveHoliday),
);

export default router;
