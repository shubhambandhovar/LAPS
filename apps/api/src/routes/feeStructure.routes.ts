import { Router, Request, Response, NextFunction } from 'express';
import {
  listFeeStructures,
  getFeeStructureById,
  createFeeStructure,
  updateFeeStructure,
  archiveFeeStructure,
} from '../controllers/feeStructure.controller';
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

router.get('/', requireFeeRead, asyncHandler(listFeeStructures));
router.get('/:id', requireFeeRead, asyncHandler(getFeeStructureById));
router.post('/', requireFeeAdminAccountant, asyncHandler(createFeeStructure));
router.put('/:id', requireFeeAdminAccountant, asyncHandler(updateFeeStructure));
router.patch('/:id/archive', requireFeeSuperOrSchoolAdmin, asyncHandler(archiveFeeStructure));

export default router;
