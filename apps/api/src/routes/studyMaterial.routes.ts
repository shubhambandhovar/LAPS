import { Router, Request, Response, NextFunction } from 'express';
import {
  getStudyMaterialList,
  getStudyMaterialById,
  createStudyMaterial,
  updateStudyMaterial,
  archiveStudyMaterial,
} from '../controllers/studyMaterial.controller';
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

router.get('/', requireHomeworkRead, asyncHandler(getStudyMaterialList));
router.get('/:id', requireHomeworkRead, asyncHandler(getStudyMaterialById));
router.post('/', requireHomeworkTeacherOrAdmin, asyncHandler(createStudyMaterial));
router.put('/:id', requireHomeworkTeacherOrAdmin, asyncHandler(updateStudyMaterial));
router.patch('/:id/archive', requireHomeworkTeacherOrAdmin, asyncHandler(archiveStudyMaterial));

export default router;
