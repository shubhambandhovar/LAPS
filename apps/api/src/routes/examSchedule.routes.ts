import { Router, Request, Response, NextFunction } from 'express';
import {
  listExamSchedules,
  getExamScheduleById,
  createExamSchedule,
  updateExamSchedule,
  archiveExamSchedule,
} from '../controllers/examSchedule.controller';
import { authenticate } from '../middleware/auth';
import { requireExamRead, requireExamAdmin } from '../middleware/examRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireExamRead, asyncHandler(listExamSchedules));
router.get('/:id', requireExamRead, asyncHandler(getExamScheduleById));
router.post('/', requireExamAdmin, asyncHandler(createExamSchedule));
router.put('/:id', requireExamAdmin, asyncHandler(updateExamSchedule));
router.patch('/:id/archive', requireExamAdmin, asyncHandler(archiveExamSchedule));

export default router;
