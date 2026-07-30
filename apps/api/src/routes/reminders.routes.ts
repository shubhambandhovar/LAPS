import { Router, Request, Response, NextFunction } from 'express';
import {
  getReminders,
  createReminder,
  cancelReminder,
} from '../controllers/reminder.controller';
import { authenticate } from '../middleware/auth';
import { enforceReminderSelfServiceScope } from '../middleware/calendarRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', asyncHandler(enforceReminderSelfServiceScope), asyncHandler(getReminders));
router.post('/', asyncHandler(enforceReminderSelfServiceScope), asyncHandler(createReminder));
router.delete('/:id', asyncHandler(enforceReminderSelfServiceScope), asyncHandler(cancelReminder));

export default router;
