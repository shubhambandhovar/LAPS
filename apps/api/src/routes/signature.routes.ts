import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  getUserSignatures,
  saveUserSignature,
  deleteUserSignature,
  getWorkflows,
  saveWorkflow,
  deleteWorkflow,
} from '../controllers/signature.controller';

const router = Router();

router.use(authenticate);

// User Signatures
router.get('/my-signatures', requirePermission('signature', 'manage'), getUserSignatures);
router.post('/my-signatures', requirePermission('signature', 'manage'), saveUserSignature);
router.delete('/my-signatures/:id', requirePermission('signature', 'manage'), deleteUserSignature);

// Approval Workflows (Admin only)
// Note: We might want a new permission for workflow management, but 'document.template.manage' or 'signature.manage' can suffice for now
router.get('/workflows', requirePermission('document', 'template.manage'), getWorkflows);
router.post('/workflows', requirePermission('document', 'template.manage'), saveWorkflow);
router.delete('/workflows/:id', requirePermission('document', 'template.manage'), deleteWorkflow);

export default router;
