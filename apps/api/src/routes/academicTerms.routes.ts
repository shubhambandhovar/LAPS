import { Router, Request, Response, NextFunction } from 'express';
import {
  getAcademicTerms,
  getAcademicTermById,
  createAcademicTerm,
  updateAcademicTerm,
  archiveAcademicTerm,
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

router.get('/', requireAcademicRead, asyncHandler(getAcademicTerms));
router.post('/', requireAcademicWrite, asyncHandler(createAcademicTerm));
router.get('/:id', requireAcademicRead, asyncHandler(getAcademicTermById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateAcademicTerm));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveAcademicTerm),
);

export default router;
