import { Router, Request, Response, NextFunction } from 'express';
import {
  getHomeworkList,
  getHomeworkById,
  createHomework,
  updateHomework,
  archiveHomework,
  getSubmissionList,
  getMySubmissions,
  submitHomework,
  updateSubmission,
  archiveSubmission,
  evaluateSubmission,
  getHomeworkAnalyticsSummary,
} from '../controllers/homework.controller';
import { authenticate } from '../middleware/auth';
import {
  requireHomeworkRead,
  requireHomeworkWrite,
  requireHomeworkTeacherOrAdmin,
} from '../middleware/homeworkRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

// Static analytics and my-submissions routes MUST come before parameter routes like /:id
router.get('/analytics/summary', requireHomeworkRead, asyncHandler(getHomeworkAnalyticsSummary));
router.get('/submissions/my', requireHomeworkRead, asyncHandler(getMySubmissions));
router.put('/submissions/:id', requireHomeworkWrite, asyncHandler(updateSubmission));
router.patch('/submissions/:id/archive', requireHomeworkTeacherOrAdmin, asyncHandler(archiveSubmission));
router.patch('/submissions/:submissionId/evaluate', requireHomeworkTeacherOrAdmin, asyncHandler(evaluateSubmission));

// Homework CRUD
router.get('/', requireHomeworkRead, asyncHandler(getHomeworkList));
router.get('/:id', requireHomeworkRead, asyncHandler(getHomeworkById));
router.post('/', requireHomeworkTeacherOrAdmin, asyncHandler(createHomework));
router.put('/:id', requireHomeworkTeacherOrAdmin, asyncHandler(updateHomework));
router.patch('/:id/archive', requireHomeworkTeacherOrAdmin, asyncHandler(archiveHomework));

// Homework Submissions list & submit for assignment
router.get('/:homeworkId/submissions', requireHomeworkTeacherOrAdmin, asyncHandler(getSubmissionList));
router.post('/:homeworkId/submissions', requireHomeworkWrite, asyncHandler(submitHomework));

export default router;
