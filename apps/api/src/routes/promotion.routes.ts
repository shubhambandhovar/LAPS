import { Router, Request, Response, NextFunction } from 'express';
import {
  listPromotions,
  evaluatePromotions,
  createOrUpdatePromotion,
  approvePromotions,
  archivePromotion,
} from '../controllers/promotion.controller';
import { authenticate } from '../middleware/auth';
import {
  requireReportCardRead,
  requireReportCardAdmin,
  enforceReportCardTeacherScope,
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

router.post('/evaluate', requireReportCardAdmin, asyncHandler(evaluatePromotions));
router.patch('/approve', requireReportCardAdmin, asyncHandler(approvePromotions));

router.get(
  '/',
  requireReportCardRead,
  asyncHandler(enforceReportCardTeacherScope),
  asyncHandler(listPromotions)
);

router.post('/', requireReportCardAdmin, asyncHandler(createOrUpdatePromotion));
router.patch('/:id/archive', requireReportCardAdmin, asyncHandler(archivePromotion));

export default router;
