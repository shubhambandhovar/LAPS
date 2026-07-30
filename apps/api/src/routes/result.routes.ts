import { Router, Request, Response, NextFunction } from 'express';
import {
  listResults,
  getMyResults,
  getResultById,
  calculateResults,
  publishResults,
  getAnalyticsSummary,
  archiveResult,
} from '../controllers/result.controller';
import { authenticate } from '../middleware/auth';
import {
  requireExamRead,
  requireExamTeacherOrAdmin,
  requireExamAdmin,
} from '../middleware/examRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/my', requireExamRead, asyncHandler(getMyResults));
router.get('/analytics/summary', requireExamTeacherOrAdmin, asyncHandler(getAnalyticsSummary));
router.get('/', requireExamTeacherOrAdmin, asyncHandler(listResults));
router.get('/:id', requireExamRead, asyncHandler(getResultById));
router.post('/calculate', requireExamAdmin, asyncHandler(calculateResults));
router.patch('/publish', requireExamAdmin, asyncHandler(publishResults));
router.patch('/:id/archive', requireExamAdmin, asyncHandler(archiveResult));

export default router;
