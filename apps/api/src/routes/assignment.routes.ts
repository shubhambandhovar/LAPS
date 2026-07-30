import { Router, Request, Response, NextFunction } from 'express';
import {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
} from '../controllers/assignment.controller';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  enforceTransportStudentScope,
  enforceTransportTeacherScope,
} from '../middleware/transportRbac';

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
  '/',
  requirePermission('transport', 'create', 'assignment'),
  enforceTransportTeacherScope,
  asyncHandler(createAssignment),
);

router.get(
  '/',
  requirePermission('transport', 'read', 'assignment'),
  enforceTransportStudentScope,
  enforceTransportTeacherScope,
  asyncHandler(getAssignments),
);

router.get(
  '/:id',
  requirePermission('transport', 'read', 'assignment'),
  enforceTransportStudentScope,
  enforceTransportTeacherScope,
  asyncHandler(getAssignmentById),
);

router.patch(
  '/:id',
  requirePermission('transport', 'update', 'assignment'),
  enforceTransportTeacherScope,
  asyncHandler(updateAssignment),
);

router.delete(
  '/:id',
  requirePermission('transport', 'delete', 'assignment'),
  enforceTransportTeacherScope,
  asyncHandler(deleteAssignment),
);

export default router;
