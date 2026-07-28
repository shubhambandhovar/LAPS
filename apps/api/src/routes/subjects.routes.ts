import { Router, Request, Response, NextFunction } from 'express';
import {
  getSubjects,
  createSubject,
  getSubjectById,
  updateSubject,
  archiveSubject,
} from '../controllers/subject.controller';
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

router.get('/', requireAcademicRead, asyncHandler(getSubjects));
router.post('/', requireAcademicWrite, asyncHandler(createSubject));
router.get('/:id', requireAcademicRead, asyncHandler(getSubjectById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateSubject));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveSubject),
);

export default router;
