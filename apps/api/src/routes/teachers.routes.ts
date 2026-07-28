import { Router, Request, Response, NextFunction } from 'express';
import {
  getTeachers,
  createTeacher,
  getTeacherById,
  updateTeacher,
  archiveTeacher,
} from '../controllers/teacher.controller';
import { authenticate } from '../middleware/auth';
import {
  requireAcademicRead,
  requireAcademicWrite,
} from '../middleware/academicRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireAcademicRead, asyncHandler(getTeachers));
router.post('/', requireAcademicWrite, asyncHandler(createTeacher));
router.get('/:id', requireAcademicRead, asyncHandler(getTeacherById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateTeacher));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveTeacher),
);

export default router;
