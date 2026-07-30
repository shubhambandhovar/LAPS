import { Router } from 'express';
import * as controller from '../controllers/admissionSummary.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.get('/analytics', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']), controller.getAnalytics);

export default router;
