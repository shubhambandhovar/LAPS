import { Router, Request, Response, NextFunction } from 'express';
import {
  ingestTelemetry,
  getLiveLocation,
  getTelemetryHistory,
} from '../controllers/gps.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { enforceDriverVehicleScope } from '../middleware/transportRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.post(
  '/telemetry',
  requirePermission('transport', 'create', 'telemetry'),
  enforceDriverVehicleScope,
  asyncHandler(ingestTelemetry),
);

router.get(
  '/live',
  requirePermission('transport', 'read', 'telemetry'),
  asyncHandler(getLiveLocation),
);

router.get(
  '/history/:vehicleId',
  requirePermission('transport', 'read', 'telemetry'),
  asyncHandler(getTelemetryHistory),
);

export default router;
