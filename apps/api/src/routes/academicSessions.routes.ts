import { Router, Request, Response, NextFunction } from 'express';
import {
  getAcademicSessions,
  createAcademicSession,
  getAcademicSessionById,
  updateAcademicSession,
  activateAcademicSession,
  archiveAcademicSession,
} from '../controllers/academicSession.controller';
import { authenticate } from '../middleware/auth';
import {
  requireAcademicRead,
  requireAcademicWrite,
} from '../middleware/academicRbac';

const router = Router();

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

router.use(authenticate);

router.get('/', requireAcademicRead, asyncHandler(getAcademicSessions));
router.post('/', requireAcademicWrite, asyncHandler(createAcademicSession));
router.get('/:id', requireAcademicRead, asyncHandler(getAcademicSessionById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateAcademicSession));
router.patch(
  '/:id/activate',
  requireAcademicWrite,
  asyncHandler(activateAcademicSession),
);
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveAcademicSession),
);

export default router;
