import { Router, Request, Response, NextFunction } from 'express';
import {
  listInvoices,
  getInvoiceById,
  generateInvoices,
  createCustomInvoice,
  waiveInvoice,
  cancelInvoice,
} from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';
import {
  requireFeeRead,
  requireFeeAdminAccountant,
  requireFeeSuperOrSchoolAdmin,
  enforceMandatoryAuditMetadata,
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
  asyncHandler(listInvoices)
);

router.get(
  '/',
  requireFeeRead,
  asyncHandler(enforceTeacherFeeReadScope),
  asyncHandler(listInvoices)
);

router.get(
  '/:id',
  requireFeeRead,
  asyncHandler(enforceStudentFeeSelfServiceScope),
  asyncHandler(getInvoiceById)
);

router.post('/generate', requireFeeAdminAccountant, asyncHandler(generateInvoices));
router.post('/custom', requireFeeAdminAccountant, asyncHandler(createCustomInvoice));

router.patch(
  '/:id/waive',
  requireFeeSuperOrSchoolAdmin,
  enforceMandatoryAuditMetadata,
  asyncHandler(waiveInvoice)
);

router.patch(
  '/:id/cancel',
  requireFeeSuperOrSchoolAdmin,
  enforceMandatoryAuditMetadata,
  asyncHandler(cancelInvoice)
);

export default router;
