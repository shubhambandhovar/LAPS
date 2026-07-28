import { Router, Request, Response, NextFunction } from 'express';
import {
  getTeachingAssignments,
  createTeachingAssignment,
  getTeachingAssignmentById,
  updateTeachingAssignment,
  archiveTeachingAssignment,
} from '../controllers/teachingAssignment.controller';
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

router.get('/', requireAcademicRead, asyncHandler(getTeachingAssignments));
router.post('/', requireAcademicWrite, asyncHandler(createTeachingAssignment));
router.get(
  '/:id',
  requireAcademicRead,
  asyncHandler(getTeachingAssignmentById),
);
router.patch(
  '/:id',
  requireAcademicWrite,
  asyncHandler(updateTeachingAssignment),
);
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveTeachingAssignment),
);

export default router;
