import { Router, Request, Response, NextFunction } from 'express';
import {
  listNotices,
  listAdminNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  publishNotice,
  archiveNotice,
  deleteNotice,
} from '../controllers/notice.controller';
import { authenticate } from '../middleware/auth';
import {
  enforceTeacherNoticeScope,
  requireCommAdminOrTeacher,
} from '../middleware/communicationRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', asyncHandler(listNotices));
router.get('/admin', requireCommAdminOrTeacher, asyncHandler(listAdminNotices));
router.get('/:id', asyncHandler(getNoticeById));

router.post('/', requireCommAdminOrTeacher, enforceTeacherNoticeScope, asyncHandler(createNotice));
router.put('/:id', requireCommAdminOrTeacher, asyncHandler(updateNotice));
router.patch('/:id', requireCommAdminOrTeacher, asyncHandler(updateNotice));
router.patch('/:id/publish', requireCommAdminOrTeacher, asyncHandler(publishNotice));
router.patch('/:id/archive', requireCommAdminOrTeacher, asyncHandler(archiveNotice));
router.delete('/:id', requireCommAdminOrTeacher, asyncHandler(deleteNotice));

export default router;
