import { Router, Request, Response, NextFunction } from 'express';
import {
  listExams,
  getExamById,
  createExam,
  updateExam,
  publishExam,
  lockExam,
  archiveExam,
} from '../controllers/exam.controller';
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

router.get('/', requireExamRead, asyncHandler(listExams));
router.get('/:id', requireExamRead, asyncHandler(getExamById));
router.post('/', requireExamAdmin, asyncHandler(createExam));
router.put('/:id', requireExamAdmin, asyncHandler(updateExam));
router.patch('/:id/publish', requireExamAdmin, asyncHandler(publishExam));
router.patch('/:id/lock', requireExamAdmin, asyncHandler(lockExam));
router.patch('/:id/archive', requireExamAdmin, asyncHandler(archiveExam));

export default router;
