import { Router, Request, Response, NextFunction } from 'express';
import {
  getMyTimetable,
  getTimetables,
  getTimetableById,
  createTimetableSlot,
  updateTimetableSlot,
  publishTimetable,
  archiveTimetableSlot,
  getTeacherWorkload,
} from '../controllers/timetable.controller';
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

router.get('/my-timetable', requireAcademicRead, asyncHandler(getMyTimetable));
router.get(
  '/workload/:teacherId',
  requireAcademicRead,
  asyncHandler(getTeacherWorkload),
);
router.post('/publish', requireAcademicWrite, asyncHandler(publishTimetable));

router.get('/', requireAcademicRead, asyncHandler(getTimetables));
router.post('/', requireAcademicWrite, asyncHandler(createTimetableSlot));
router.get('/:id', requireAcademicRead, asyncHandler(getTimetableById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateTimetableSlot));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveTimetableSlot),
);

export default router;
