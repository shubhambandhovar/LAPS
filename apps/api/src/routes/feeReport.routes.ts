import { Router, Request, Response, NextFunction } from 'express';
import {
  getFinancialSummaryReport,
  getDailyCollectionReport,
  getMonthlyCollectionReport,
  getClassWiseDuesReport,
  getDefaultersReport,
  getStudentFeeStatement,
} from '../controllers/feeReport.controller';
import { authenticate } from '../middleware/auth';
import {
  requireFeeRead,
  requireFeeAdminAccountant,
  enforceTeacherFeeReadScope,
} from '../middleware/feeRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/summary', requireFeeAdminAccountant, asyncHandler(getFinancialSummaryReport));
router.get('/daily-collection', requireFeeAdminAccountant, asyncHandler(getDailyCollectionReport));
router.get('/monthly-collection', requireFeeAdminAccountant, asyncHandler(getMonthlyCollectionReport));
router.get('/class-dues', requireFeeAdminAccountant, asyncHandler(getClassWiseDuesReport));

router.get(
  '/defaulters',
  requireFeeRead,
  asyncHandler(enforceTeacherFeeReadScope),
  asyncHandler(getDefaultersReport)
);

router.get('/statement/:enrollmentId', requireFeeRead, asyncHandler(getStudentFeeStatement));

export default router;
