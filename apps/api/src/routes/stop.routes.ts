import { Router, Request, Response, NextFunction } from 'express';
import {
  createStop,
  getStops,
  getStopById,
  updateStop,
  deleteStop,
} from '../controllers/stop.controller';
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

router.post('/', requirePermission('transport', 'create', 'stop'), asyncHandler(createStop));
router.get('/', requirePermission('transport', 'read', 'stop'), asyncHandler(getStops));
router.get('/:id', requirePermission('transport', 'read', 'stop'), asyncHandler(getStopById));
router.patch('/:id', requirePermission('transport', 'update', 'stop'), asyncHandler(updateStop));
router.delete('/:id', requirePermission('transport', 'delete', 'stop'), asyncHandler(deleteStop));

export default router;
