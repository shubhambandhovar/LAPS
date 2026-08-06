import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  getTemplates,
  getTemplate,
  saveTemplate,
  generateDocument,
  getRecords,
  getRecordDetails,
  revokeDocument,
  getApprovalQueue,
  signDocument,
} from '../controllers/document.controller';

const router = Router();

router.use(authenticate);

// Templates
router.get('/templates', getTemplates); // Read might be needed for dropdowns, so open to authenticated (dashboard filters UI)
router.get('/templates/:id', getTemplate);
router.post('/templates', requirePermission('document', 'template.manage'), saveTemplate);

// Records
router.get('/records', requirePermission('document', 'read'), getRecords);
router.get('/records/approval-queue', requirePermission('document', 'approve'), getApprovalQueue);
router.get('/records/:id', requirePermission('document', 'read'), getRecordDetails);

// Actions
router.post('/generate', requirePermission('document', 'issue'), generateDocument);
router.post('/records/:id/sign', requirePermission('document', 'approve'), signDocument);
router.delete('/records/:id/revoke', requirePermission('document', 'issue'), revokeDocument);

export default router;
