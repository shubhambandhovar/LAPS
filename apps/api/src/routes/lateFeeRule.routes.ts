import { Router, Request, Response, NextFunction } from 'express';
import {
  listLateFeeRules,
  getLateFeeRuleById,
  createLateFeeRule,
  updateLateFeeRule,
  archiveLateFeeRule,
} from '../controllers/lateFeeRule.controller';
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

router.get('/', requireFeeRead, asyncHandler(listLateFeeRules));
router.get('/:id', requireFeeRead, asyncHandler(getLateFeeRuleById));
router.post('/', requireFeeAdminAccountant, asyncHandler(createLateFeeRule));
router.put('/:id', requireFeeAdminAccountant, asyncHandler(updateLateFeeRule));
router.patch('/:id/archive', requireFeeSuperOrSchoolAdmin, asyncHandler(archiveLateFeeRule));

export default router;
