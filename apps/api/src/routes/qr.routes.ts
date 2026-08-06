import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  generateQr,
  bulkGenerateQr,
  verifyQr,
  getScanHistory,
  revokeQr,
  getQrById,
  getActiveQrForReference,
} from '../controllers/qr.controller';

const router = Router();

// Apply auth to all QR routes
router.use(authenticate);

// Generate
router.post('/generate', requirePermission('qr', 'CREATE'), generateQr);
router.post('/generate/bulk', requirePermission('qr', 'CREATE'), bulkGenerateQr);

// Verify
router.post('/verify', requirePermission('qr', 'SCAN'), verifyQr);

// History & Auditing
router.get('/history', requirePermission('qr', 'READ'), getScanHistory);

// Management
router.delete('/:id', requirePermission('qr', 'DELETE'), revokeQr);
router.get('/:id', requirePermission('qr', 'READ'), getQrById);
router.get('/reference/:referenceId', requirePermission('qr', 'READ'), getActiveQrForReference);

export default router;
