import { Router } from 'express';
import * as controller from '../controllers/admissionReview.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']), controller.submitReview);
router.get('/:applicationId', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER', 'APPLICANT']), controller.getReviewsForApplication);

export default router;
