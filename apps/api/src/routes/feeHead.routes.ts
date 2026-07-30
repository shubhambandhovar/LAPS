import { Router, Request, Response, NextFunction } from 'express';
import {
  listFeeHeads,
  getFeeHeadById,
  createFeeHead,
  updateFeeHead,
  archiveFeeHead,
} from '../controllers/feeHead.controller';
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

router.get('/', requireFeeRead, asyncHandler(listFeeHeads));
router.get('/:id', requireFeeRead, asyncHandler(getFeeHeadById));
router.post('/', requireFeeAdminAccountant, asyncHandler(createFeeHead));
router.put('/:id', requireFeeAdminAccountant, asyncHandler(updateFeeHead));
router.patch('/:id/archive', requireFeeSuperOrSchoolAdmin, asyncHandler(archiveFeeHead));

export default router;
