import { Router, Request, Response, NextFunction } from 'express';
import {
  getSessionContext,
  markAttendanceBatch,
  submitAttendance,
  bulkMarkAttendance,
  getAttendanceRegister,
  toggleLockSession,
  freezeAttendanceSession,
  reopenAttendanceSession,
  archiveAttendance,
} from '../controllers/attendance.controller';
import {
  createCorrectionRequest,
  listCorrectionRequests,
  reviewCorrectionRequest,
} from '../controllers/attendanceCorrection.controller';
import {
  getLockRule,
  upsertLockRule,
} from '../controllers/attendanceLockRule.controller';
import {
  getAnalyticsSummary,
} from '../controllers/attendanceAnalytics.controller';
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

// Attendance Sessions & Register
router.get('/session-context', requireAttendanceRead, asyncHandler(getSessionContext));
router.post('/', requireAttendanceWrite, asyncHandler(markAttendanceBatch));
router.post('/bulk', requireAttendanceWrite, asyncHandler(bulkMarkAttendance));
router.get('/register', requireAttendanceRead, asyncHandler(getAttendanceRegister));

// Corrections
router.post('/corrections', requireAttendanceWrite, asyncHandler(createCorrectionRequest));
router.get('/corrections', requireAttendanceRead, asyncHandler(listCorrectionRequests));
router.patch('/corrections/:id/review', requireAttendanceAdmin, asyncHandler(reviewCorrectionRequest));

// Lock Rules
router.get('/lock-rules', requireAttendanceRead, asyncHandler(getLockRule));
router.put('/lock-rules', requireAttendanceAdmin, asyncHandler(upsertLockRule));

// Analytics
router.get('/analytics/summary', requireAttendanceRead, asyncHandler(getAnalyticsSummary));

// Session Lifecycle & Admin Operations
router.post('/:id/submit', requireAttendanceWrite, asyncHandler(submitAttendance));
router.patch('/:id/lock', requireAttendanceAdmin, asyncHandler(toggleLockSession));
router.patch('/:id/freeze', requireAttendanceAdmin, asyncHandler(freezeAttendanceSession));
router.patch('/:id/reopen', requireAttendanceAdmin, asyncHandler(reopenAttendanceSession));
router.patch('/:id/archive', requireAttendanceAdmin, asyncHandler(archiveAttendance));

export default router;
