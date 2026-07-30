import { Router, Request, Response, NextFunction } from 'express';
import {
  listFeeDiscounts,
  getFeeDiscountById,
  createFeeDiscount,
  updateFeeDiscount,
  archiveFeeDiscount,
} from '../controllers/feeDiscount.controller';
import { authenticate } from '../middleware/auth';
import { requireFeeRead, requireFeeAdminAccountant, requireFeeSuperOrSchoolAdmin } from '../middleware/feeRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireFeeRead, asyncHandler(listFeeDiscounts));
router.get('/:id', requireFeeRead, asyncHandler(getFeeDiscountById));
router.post('/', requireFeeAdminAccountant, asyncHandler(createFeeDiscount));
router.put('/:id', requireFeeAdminAccountant, asyncHandler(updateFeeDiscount));
router.patch('/:id/archive', requireFeeSuperOrSchoolAdmin, asyncHandler(archiveFeeDiscount));

export default router;
