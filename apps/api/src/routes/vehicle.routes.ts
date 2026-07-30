import { Router, Request, Response, NextFunction } from 'express';
import {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicle.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.post('/', requirePermission('transport', 'create', 'vehicle'), asyncHandler(createVehicle));
router.get('/', requirePermission('transport', 'read', 'vehicle'), asyncHandler(getVehicles));
router.get('/:id', requirePermission('transport', 'read', 'vehicle'), asyncHandler(getVehicleById));
router.patch('/:id', requirePermission('transport', 'update', 'vehicle'), asyncHandler(updateVehicle));
router.delete('/:id', requirePermission('transport', 'delete', 'vehicle'), asyncHandler(deleteVehicle));

export default router;
