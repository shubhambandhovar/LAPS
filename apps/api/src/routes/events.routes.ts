import { Router, Request, Response, NextFunction } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  archiveEvent,
} from '../controllers/event.controller';
import { authenticate } from '../middleware/auth';
import { requireAcademicRead } from '../middleware/academicRbac';
import { enforceTeacherEventScope } from '../middleware/calendarRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', asyncHandler(getEvents));
router.get('/:id', asyncHandler(getEventById));

router.post(
  '/',
  requireAcademicRead,
  asyncHandler(enforceTeacherEventScope),
  asyncHandler(createEvent)
);

router.patch(
  '/:id',
  requireAcademicRead,
  asyncHandler(enforceTeacherEventScope),
  asyncHandler(updateEvent)
);

router.patch(
  '/:id/archive',
  requireAcademicRead,
  asyncHandler(enforceTeacherEventScope),
  asyncHandler(archiveEvent)
);

export default router;
