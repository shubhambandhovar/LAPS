import { Router, Request, Response, NextFunction } from 'express';
import {
  getStudentGuardians,
  createStudentGuardian,
  updateStudentGuardian,
  deleteStudentGuardian,
} from '../controllers/studentGuardian.controller';
import { authenticate } from '../middleware/auth';
import {
  requireStudentRead,
  requireStudentWrite,
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

router.get('/', requireStudentRead, asyncHandler(getStudentGuardians));
router.post('/', requireStudentWrite, asyncHandler(createStudentGuardian));
router.patch('/:id', requireStudentWrite, asyncHandler(updateStudentGuardian));
router.delete('/:id', requireStudentWrite, asyncHandler(deleteStudentGuardian));

export default router;
