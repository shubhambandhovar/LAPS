import { Router } from 'express';
import * as controller from '../controllers/admission.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Applicant specific routes
router.get('/me', requireRole(['APPLICANT']), controller.getMyApplications);
router.post('/draft', requireRole(['APPLICANT']), controller.saveDraftApplication);
router.post('/submit', requireRole(['APPLICANT']), controller.submitApplication);

// Admin specific routes
router.get('/', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']), controller.getAllApplications);
router.get('/:id', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER', 'APPLICANT']), controller.getApplicationDetails);

export default router;
