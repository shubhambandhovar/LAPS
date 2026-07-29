import { Router, Request, Response, NextFunction } from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  archiveRoom,
} from '../controllers/curriculum.controller';
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

router.get('/', requireAcademicRead, asyncHandler(getRooms));
router.post('/', requireAcademicWrite, asyncHandler(createRoom));
router.get('/:id', requireAcademicRead, asyncHandler(getRoomById));
router.patch('/:id', requireAcademicWrite, asyncHandler(updateRoom));
router.patch(
  '/:id/archive',
  requireAcademicWrite,
  asyncHandler(archiveRoom),
);

export default router;
