import { Router, Request, Response, NextFunction } from 'express';
import {
  getClassSubjects,
  getClassSubjectById,
  createClassSubject,
  updateClassSubject,
  archiveClassSubject,
} from '../controllers/curriculum.controller';
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

router.get('/', requireAcademicRead, asyncHandler(getClassSubjects));
router.post('/', requireAcademicWrite, asyncHandler(createClassSubject));
router.get('/:id', requireAcademicRead, asyncHandler(getClassSubjectById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateClassSubject));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveClassSubject),
);

export default router;
