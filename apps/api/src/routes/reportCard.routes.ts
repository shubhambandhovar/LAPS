import { Router, Request, Response, NextFunction } from 'express';
import {
  listReportCards,
  getMyReportCards,
  getReportCardById,
  generateReportCards,
  publishReportCards,
  updateReportCardRemarks,
  downloadReportCardPdf,
  archiveReportCard,
} from '../controllers/reportCard.controller';
import { authenticate } from '../middleware/auth';
import {
  requireReportCardRead,
  requireReportCardAdmin,
  requireReportCardTeacherOrAdmin,
  enforceReportCardTeacherScope,
  enforceStudentReportCardScope,
} from '../middleware/reportCardRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

// Specific paths first
router.get(
  '/my',
  requireReportCardRead,
  asyncHandler(enforceStudentReportCardScope),
  asyncHandler(getMyReportCards)
);

router.post('/generate', requireReportCardAdmin, asyncHandler(generateReportCards));
router.patch('/publish', requireReportCardAdmin, asyncHandler(publishReportCards));

// Root collection and parameterized ID paths
router.get(
  '/',
  requireReportCardRead,
  asyncHandler(enforceReportCardTeacherScope),
  asyncHandler(listReportCards)
);

router.get('/:id/download', requireReportCardRead, asyncHandler(downloadReportCardPdf));

router.patch(
  '/:id/remarks',
  requireReportCardTeacherOrAdmin,
  asyncHandler(enforceReportCardTeacherScope),
  asyncHandler(updateReportCardRemarks)
);

router.patch('/:id/archive', requireReportCardAdmin, asyncHandler(archiveReportCard));
router.get('/:id', requireReportCardRead, asyncHandler(getReportCardById));

export default router;
