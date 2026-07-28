import { Router, Request, Response, NextFunction } from 'express';
import {
  getSections,
  createSection,
  getSectionById,
  updateSection,
  archiveSection,
} from '../controllers/section.controller';
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

router.get('/', requireAcademicRead, asyncHandler(getSections));
router.post('/', requireAcademicWrite, asyncHandler(createSection));
router.get('/:id', requireAcademicRead, asyncHandler(getSectionById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateSection));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveSection),
);

export default router;
