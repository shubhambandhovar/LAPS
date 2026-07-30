import { Router, Request, Response, NextFunction } from 'express';
import {
  createDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
} from '../controllers/driver.controller';
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

router.post('/', requirePermission('transport', 'create', 'driver'), asyncHandler(createDriver));
router.get('/', requirePermission('transport', 'read', 'driver'), asyncHandler(getDrivers));
router.get('/:id', requirePermission('transport', 'read', 'driver'), asyncHandler(getDriverById));
router.patch('/:id', requirePermission('transport', 'update', 'driver'), asyncHandler(updateDriver));
router.delete('/:id', requirePermission('transport', 'delete', 'driver'), asyncHandler(deleteDriver));

export default router;
