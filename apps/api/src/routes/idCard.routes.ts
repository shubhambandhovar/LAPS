import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  getTemplates,
  saveTemplate,
  generateCard,
  getActiveCard,
  revokeCard,
  getCardMasterData
} from '../controllers/idCard.controller';

const router = Router();

router.use(authenticate);

// Templates
router.get('/templates', requirePermission('id_card', 'READ'), getTemplates);
router.post('/templates', requirePermission('id_card', 'CREATE'), saveTemplate);

// Card Actions
router.post('/generate', requirePermission('id_card', 'CREATE'), generateCard);
router.delete('/:id/revoke', requirePermission('id_card', 'DELETE'), revokeCard);

// Reading Cards
router.get('/active/:referenceId', requirePermission('id_card', 'READ'), getActiveCard);
router.get('/master-data/:referenceId', requirePermission('id_card', 'READ'), getCardMasterData);

export default router;
