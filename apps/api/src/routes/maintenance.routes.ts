import { Router, Request, Response, NextFunction } from 'express';
import {
  createMaintenanceRecord,
  getMaintenanceRecords,
  getMaintenanceRecordById,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
} from '../controllers/maintenance.controller';
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

router.post('/', requirePermission('transport', 'create', 'maintenance'), asyncHandler(createMaintenanceRecord));
router.get('/', requirePermission('transport', 'read', 'maintenance'), asyncHandler(getMaintenanceRecords));
router.get('/:id', requirePermission('transport', 'read', 'maintenance'), asyncHandler(getMaintenanceRecordById));
router.patch('/:id', requirePermission('transport', 'update', 'maintenance'), asyncHandler(updateMaintenanceRecord));
router.delete('/:id', requirePermission('transport', 'delete', 'maintenance'), asyncHandler(deleteMaintenanceRecord));

export default router;
