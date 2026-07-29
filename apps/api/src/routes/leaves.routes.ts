import { Router, Request, Response, NextFunction } from 'express';
import {
  createLeaveRequest,
  listLeaveRequests,
  getLeaveRequestById,
  reviewLeaveRequest,
  cancelLeaveRequest,
  archiveLeaveRequest,
} from '../controllers/leave.controller';
import { authenticate } from '../middleware/auth';
import {
  requireAttendanceRead,
  requireAttendanceWrite,
  requireAttendanceAdmin,
} from '../middleware/attendanceRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.post('/', requireAttendanceWrite, asyncHandler(createLeaveRequest));
router.get('/', requireAttendanceRead, asyncHandler(listLeaveRequests));
router.get('/:id', requireAttendanceRead, asyncHandler(getLeaveRequestById));
router.patch('/:id/review', requireAttendanceWrite, asyncHandler(reviewLeaveRequest));
router.patch('/:id/cancel', requireAttendanceWrite, asyncHandler(cancelLeaveRequest));
router.patch('/:id/archive', requireAttendanceAdmin, asyncHandler(archiveLeaveRequest));

export default router;
