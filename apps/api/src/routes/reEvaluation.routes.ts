import { Router, Request, Response, NextFunction } from 'express';
import {
  listReEvaluations,
  getReEvaluationById,
  createReEvaluationRequest,
  reviewReEvaluation,
  completeReEvaluation,
  archiveReEvaluation,
} from '../controllers/reEvaluation.controller';
import { authenticate } from '../middleware/auth';
import {
  requireExamRead,
  requireExamStudentOrGuardianOrAdmin,
  requireExamAdmin,
  requireExamTeacherOrAdmin,
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

router.get('/', requireExamRead, asyncHandler(listReEvaluations));
router.get('/:id', requireExamRead, asyncHandler(getReEvaluationById));
router.post('/', requireExamStudentOrGuardianOrAdmin, asyncHandler(createReEvaluationRequest));
router.patch('/:id/review', requireExamAdmin, asyncHandler(reviewReEvaluation));
router.patch('/:id/complete', requireExamTeacherOrAdmin, asyncHandler(completeReEvaluation));
router.patch('/:id/archive', requireExamAdmin, asyncHandler(archiveReEvaluation));

export default router;
