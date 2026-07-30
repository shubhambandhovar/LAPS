import { Router, Request, Response, NextFunction } from 'express';
import {
  getUnifiedCalendar,
  getCalendarSummary,
} from '../controllers/calendar.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', asyncHandler(getUnifiedCalendar));
router.get('/my', asyncHandler(getUnifiedCalendar));
router.get('/summary', asyncHandler(getCalendarSummary));

export default router;
