import { Router, Request, Response, NextFunction } from 'express';
import {
  listPayments,
  getPaymentById,
  recordPayment,
  refundPayment,
  reversePayment,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import {
  requireFeeRead,
  requireFeeAdminAccountant,
  requireFeeSuperOrSchoolAdmin,
  enforceMandatoryAuditMetadata,
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
  asyncHandler(listPayments)
);

router.get('/', requireFeeAdminAccountant, asyncHandler(listPayments));
router.get('/:id', requireFeeRead, asyncHandler(getPaymentById));

router.post('/', requireFeeAdminAccountant, asyncHandler(recordPayment));

router.post(
  '/:id/refund',
  requireFeeSuperOrSchoolAdmin,
  enforceMandatoryAuditMetadata,
  asyncHandler(refundPayment)
);

router.post(
  '/:id/reverse',
  requireFeeSuperOrSchoolAdmin,
  enforceMandatoryAuditMetadata,
  asyncHandler(reversePayment)
);

export default router;
