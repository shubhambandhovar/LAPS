import { Router, Request, Response, NextFunction } from 'express';
import {
  listAssessmentComponents,
  getAssessmentComponentById,
  createAssessmentComponent,
  updateAssessmentComponent,
  archiveAssessmentComponent,
} from '../controllers/assessmentComponent.controller';
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

router.get('/', requireExamRead, asyncHandler(listAssessmentComponents));
router.get('/:id', requireExamRead, asyncHandler(getAssessmentComponentById));
router.post('/', requireExamAdmin, asyncHandler(createAssessmentComponent));
router.put('/:id', requireExamAdmin, asyncHandler(updateAssessmentComponent));
router.patch('/:id/archive', requireExamAdmin, asyncHandler(archiveAssessmentComponent));

export default router;
