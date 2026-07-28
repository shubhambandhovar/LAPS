import { Router, Request, Response, NextFunction } from 'express';
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  archiveStudent,
  updateStudentStatus,
} from '../controllers/student.controller';
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

router.get('/', requireStudentRead, requireStudentReadScope, asyncHandler(getStudents));
router.post('/', requireStudentWrite, asyncHandler(createStudent));
router.get('/:id', requireStudentRead, requireStudentReadScope, asyncHandler(getStudentById));
router.patch('/:id', requireStudentWrite, asyncHandler(updateStudent));
router.patch('/:id/archive', requireStudentWrite, asyncHandler(archiveStudent));
router.patch('/:id/status', requireStudentWrite, asyncHandler(updateStudentStatus));

export default router;
