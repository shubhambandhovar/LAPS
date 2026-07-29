import { Router, Request, Response, NextFunction } from 'express';
import {
  getCalendarEvents,
  getCalendarEventById,
  createCalendarEvent,
  updateCalendarEvent,
  archiveCalendarEvent,
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

router.get('/', requireAcademicRead, asyncHandler(getCalendarEvents));
router.post('/', requireAcademicWrite, asyncHandler(createCalendarEvent));
router.get('/:id', requireAcademicRead, asyncHandler(getCalendarEventById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateCalendarEvent));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveCalendarEvent),
);

export default router;
