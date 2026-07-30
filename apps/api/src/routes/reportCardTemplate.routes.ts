import { Router, Request, Response, NextFunction } from 'express';
import {
  listReportCardTemplates,
  getReportCardTemplateById,
  createReportCardTemplate,
  updateReportCardTemplate,
  setDefaultReportCardTemplate,
  archiveReportCardTemplate,
} from '../controllers/reportCardTemplate.controller';
import { authenticate } from '../middleware/auth';
import { requireReportCardRead, requireReportCardAdmin } from '../middleware/reportCardRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireReportCardRead, asyncHandler(listReportCardTemplates));
router.get('/:id', requireReportCardRead, asyncHandler(getReportCardTemplateById));
router.post('/', requireReportCardAdmin, asyncHandler(createReportCardTemplate));
router.put('/:id', requireReportCardAdmin, asyncHandler(updateReportCardTemplate));
router.patch('/:id/default', requireReportCardAdmin, asyncHandler(setDefaultReportCardTemplate));
router.patch('/:id/archive', requireReportCardAdmin, asyncHandler(archiveReportCardTemplate));

export default router;
