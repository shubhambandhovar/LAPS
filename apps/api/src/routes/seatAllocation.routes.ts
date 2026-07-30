import { Router } from 'express';
import * as controller from '../controllers/seatAllocation.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER']));

router.get('/', controller.getSeatAllocations);
router.patch('/:id', controller.updateSeatAllocation);
router.post('/initialize', controller.initializeSeatAllocation);

export default router;
