import { Router, Request, Response, NextFunction } from 'express';
import {
  listGradeScales,
  getGradeScaleById,
  createGradeScale,
  updateGradeScale,
  archiveGradeScale,
} from '../controllers/gradeScale.controller';
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

router.get('/', requireExamRead, asyncHandler(listGradeScales));
router.get('/:id', requireExamRead, asyncHandler(getGradeScaleById));
router.post('/', requireExamAdmin, asyncHandler(createGradeScale));
router.put('/:id', requireExamAdmin, asyncHandler(updateGradeScale));
router.patch('/:id/archive', requireExamAdmin, asyncHandler(archiveGradeScale));

export default router;
