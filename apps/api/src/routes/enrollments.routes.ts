import { Router, Request, Response, NextFunction } from 'express';
import {
  getEnrollments,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  archiveEnrollment,
  promoteEnrollment,
  transferEnrollment,
  withdrawEnrollment,
} from '../controllers/enrollment.controller';
import { authenticate } from '../middleware/auth';
import {
  requireStudentRead,
  requireStudentWrite,
  requireStudentReadScope,
} from '../middleware/studentRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireStudentRead, requireStudentReadScope, asyncHandler(getEnrollments));
router.post('/', requireStudentWrite, asyncHandler(createEnrollment));
router.get('/:id', requireStudentRead, requireStudentReadScope, asyncHandler(getEnrollmentById));
router.patch('/:id', requireStudentWrite, asyncHandler(updateEnrollment));
router.patch('/:id/archive', requireStudentWrite, asyncHandler(archiveEnrollment));
router.post('/:id/promote', requireStudentWrite, asyncHandler(promoteEnrollment));
router.post('/:id/transfer', requireStudentWrite, asyncHandler(transferEnrollment));
router.post('/:id/withdraw', requireStudentWrite, asyncHandler(withdrawEnrollment));

export default router;
