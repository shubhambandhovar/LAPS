import { Router, Request, Response, NextFunction } from 'express';
import {
  getReceiptByNumber,
  listReceiptVersions,
  verifyReceipt,
  downloadReceiptPdf,
} from '../controllers/receipt.controller';
import { authenticate } from '../middleware/auth';
import { requireFeeRead, enforceStudentFeeSelfServiceScope } from '../middleware/feeRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/:receiptNumber/verify', requireFeeRead, asyncHandler(enforceStudentFeeSelfServiceScope), asyncHandler(verifyReceipt));
router.get('/:receiptNumber/versions', requireFeeRead, asyncHandler(enforceStudentFeeSelfServiceScope), asyncHandler(listReceiptVersions));
router.get('/:receiptNumber/pdf', requireFeeRead, asyncHandler(enforceStudentFeeSelfServiceScope), asyncHandler(downloadReceiptPdf));
router.get('/:receiptNumber', requireFeeRead, asyncHandler(enforceStudentFeeSelfServiceScope), asyncHandler(getReceiptByNumber));

export default router;
