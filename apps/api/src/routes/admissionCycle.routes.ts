import { Router } from 'express';
import * as controller from '../controllers/admissionCycle.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Publicly accessible to fetch the active cycle for the landing page
router.get('/active', controller.getActiveAdmissionCycle);

// Admin routes
router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']));

router.get('/', controller.getAdmissionCycles);
router.post('/', controller.createAdmissionCycle);
router.patch('/:id', controller.updateAdmissionCycle);

export default router;
