import { Router, Request, Response, NextFunction } from 'express';
import {
  listFinancialYears,
  getFinancialYearById,
  createFinancialYear,
  updateFinancialYear,
} from '../controllers/financialYear.controller';
import { authenticate } from '../middleware/auth';
import { requireFeeRead, requireFeeAdminAccountant } from '../middleware/feeRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireFeeRead, asyncHandler(listFinancialYears));
router.get('/:id', requireFeeRead, asyncHandler(getFinancialYearById));
router.post('/', requireFeeAdminAccountant, asyncHandler(createFinancialYear));
router.put('/:id', requireFeeAdminAccountant, asyncHandler(updateFinancialYear));

export default router;
