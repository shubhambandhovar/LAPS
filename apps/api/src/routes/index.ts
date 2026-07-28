import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';

const router = Router();

// Phase 1 Foundation: Mount Health Check endpoint
router.use('/health', healthRoutes);

// Phase 2: Mount Authentication & Multi-Device Session Security endpoints
router.use('/auth', authRoutes);

export default router;
