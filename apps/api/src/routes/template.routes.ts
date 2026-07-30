import { Router, Request, Response, NextFunction } from 'express';
import {
  listTemplates,
  getTemplateByCode,
  createTemplate,
  updateTemplate,
  previewTemplate,
} from '../controllers/template.controller';
import { authenticate } from '../middleware/auth';
import {
  requireCommAdmin,
  requireCommAdminOrTeacher,
} from '../middleware/communicationRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireCommAdminOrTeacher, asyncHandler(listTemplates));
router.get('/code/:code', requireCommAdminOrTeacher, asyncHandler(getTemplateByCode));
router.post('/', requireCommAdmin, asyncHandler(createTemplate));
router.put('/:id', requireCommAdmin, asyncHandler(updateTemplate));
router.patch('/:id', requireCommAdmin, asyncHandler(updateTemplate));
router.post('/:id/preview', requireCommAdminOrTeacher, asyncHandler(previewTemplate));

export default router;
