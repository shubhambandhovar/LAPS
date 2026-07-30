import { Router, Request, Response, NextFunction } from 'express';
import {
  listStudentFeeLedgers,
  getStudentFeeLedgerByEnrollment,
  getMyStudentFeeLedger,
} from '../controllers/studentLedger.controller';
import { authenticate } from '../middleware/auth';
import {
  requireFeeRead,
  enforceTeacherFeeReadScope,
  enforceStudentFeeSelfServiceScope,
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

router.get(
  '/my',
  requireFeeRead,
  asyncHandler(enforceStudentFeeSelfServiceScope),
  asyncHandler(getMyStudentFeeLedger)
);

router.get(
  '/',
  requireFeeRead,
  asyncHandler(enforceTeacherFeeReadScope),
  asyncHandler(listStudentFeeLedgers)
);

router.get(
  '/enrollment/:enrollmentId',
  requireFeeRead,
  asyncHandler(enforceStudentFeeSelfServiceScope),
  asyncHandler(getStudentFeeLedgerByEnrollment)
);

export default router;
