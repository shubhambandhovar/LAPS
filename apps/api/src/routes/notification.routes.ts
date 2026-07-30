import { Router, Request, Response, NextFunction } from 'express';
import {
  listMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  deleteNotification,
  sendDirectNotification,
  sendBulkNotification,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import {
  enforceSelfServiceNotificationScope,
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

router.get('/', asyncHandler(listMyNotifications));
router.get('/unread-count', asyncHandler(getUnreadCount));
router.patch('/read-all', asyncHandler(markAllNotificationsRead));
router.patch('/:id/read', enforceSelfServiceNotificationScope, asyncHandler(markNotificationRead));
router.patch('/:id/archive', enforceSelfServiceNotificationScope, asyncHandler(archiveNotification));
router.delete('/:id', enforceSelfServiceNotificationScope, asyncHandler(deleteNotification));

router.post('/send', requireCommAdminOrTeacher, enforceTeacherNoticeScope, asyncHandler(sendDirectNotification));
router.post('/bulk-send', requireCommAdminOrTeacher, enforceTeacherNoticeScope, asyncHandler(sendBulkNotification));

export default router;
