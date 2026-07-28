import { Router, Request, Response, NextFunction } from 'express';
import {
  getClasses,
  createClass,
  getClassById,
  updateClass,
  archiveClass,
} from '../controllers/class.controller';
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

router.get('/', requireAcademicRead, asyncHandler(getClasses));
router.post('/', requireAcademicWrite, asyncHandler(createClass));
router.get('/:id', requireAcademicRead, asyncHandler(getClassById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateClass));
router.patch('/:id/archive', requireAcademicWrite, asyncHandler(archiveClass));

export default router;
