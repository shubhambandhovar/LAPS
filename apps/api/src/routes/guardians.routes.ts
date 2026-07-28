import { Router, Request, Response, NextFunction } from 'express';
import {
  getGuardians,
  getGuardianById,
  createGuardian,
  updateGuardian,
  archiveGuardian,
} from '../controllers/guardian.controller';
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

router.get('/', requireStudentRead, asyncHandler(getGuardians));
router.post('/', requireStudentWrite, asyncHandler(createGuardian));
router.get('/:id', requireStudentRead, asyncHandler(getGuardianById));
router.patch('/:id', requireStudentWrite, asyncHandler(updateGuardian));
router.patch('/:id/archive', requireStudentWrite, asyncHandler(archiveGuardian));

export default router;
