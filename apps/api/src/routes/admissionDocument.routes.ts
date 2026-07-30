import { Router } from 'express';
import * as controller from '../controllers/admissionDocument.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', requireRole(['APPLICANT', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']), controller.uploadDocument);
router.get('/:applicationId', requireRole(['APPLICANT', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']), controller.getDocumentsForApplication);
router.patch('/:id/verify', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']), controller.verifyDocument);

export default router;
