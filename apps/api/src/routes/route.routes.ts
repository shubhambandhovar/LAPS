import { Router, Request, Response, NextFunction } from 'express';
import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
} from '../controllers/route.controller';
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

router.post('/', requirePermission('transport', 'create', 'route'), asyncHandler(createRoute));
router.get('/', requirePermission('transport', 'read', 'route'), asyncHandler(getRoutes));
router.get('/:id', requirePermission('transport', 'read', 'route'), asyncHandler(getRouteById));
router.patch('/:id', requirePermission('transport', 'update', 'route'), asyncHandler(updateRoute));
router.delete('/:id', requirePermission('transport', 'delete', 'route'), asyncHandler(deleteRoute));

export default router;
