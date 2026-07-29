import { Router, Request, Response, NextFunction } from 'express';
import {
  getRubricList,
  createRubric,
  updateRubric,
  archiveRubric,
} from '../controllers/rubric.controller';
import { authenticate } from '../middleware/auth';
import {
  requireHomeworkRead,
  requireHomeworkTeacherOrAdmin,
} from '../middleware/homeworkRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireHomeworkRead, asyncHandler(getRubricList));
router.post('/', requireHomeworkTeacherOrAdmin, asyncHandler(createRubric));
router.put('/:id', requireHomeworkTeacherOrAdmin, asyncHandler(updateRubric));
router.patch('/:id/archive', requireHomeworkTeacherOrAdmin, asyncHandler(archiveRubric));

export default router;
