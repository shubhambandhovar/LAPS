import { Router, Request, Response, NextFunction } from 'express';
import {
  listMarksEntries,
  getMarksEntryById,
  bulkEnterMarks,
  submitMarks,
  lockMarks,
  publishMarks,
  awardGraceMarks,
  archiveMarksEntry,
} from '../controllers/marks.controller';
import { authenticate } from '../middleware/auth';
import {
  requireExamRead,
  requireExamTeacherOrAdmin,
  requireExamAdmin,
} from '../middleware/examRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireExamRead, asyncHandler(listMarksEntries));
router.get('/:id', requireExamRead, asyncHandler(getMarksEntryById));
router.post('/bulk', requireExamTeacherOrAdmin, asyncHandler(bulkEnterMarks));
router.post('/submit', requireExamTeacherOrAdmin, asyncHandler(submitMarks));
router.patch('/lock', requireExamAdmin, asyncHandler(lockMarks));
router.patch('/publish', requireExamAdmin, asyncHandler(publishMarks));
router.post('/:id/grace', requireExamAdmin, asyncHandler(awardGraceMarks));
router.patch('/:id/grace', requireExamAdmin, asyncHandler(awardGraceMarks));
router.patch('/:id/archive', requireExamAdmin, asyncHandler(archiveMarksEntry));

export default router;
