import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Analytics & Dashboard (Only SUPER_ADMIN, SCHOOL_ADMIN, and relevant roles based on UI)
// For simplicity, we can let the UI restrict or specific controllers check further.
router.get('/dashboard/executive', authenticate, requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), ReportsController.getExecutiveDashboard);
router.get('/analytics/:module', authenticate, ReportsController.getModuleAnalytics);

// Report Generation and Export
router.post('/generate', authenticate, ReportsController.generateReport);
router.post('/export', authenticate, ReportsController.exportReport);

// Report Templates
router.get('/report-templates', authenticate, ReportsController.getTemplates);
router.post('/report-templates', authenticate, requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), ReportsController.createTemplate);

// Saved Reports
router.get('/saved', authenticate, ReportsController.getSavedReports);
router.post('/saved', authenticate, ReportsController.createSavedReport);

// Scheduled Reports
router.get('/scheduled-reports', authenticate, ReportsController.getScheduledReports);
router.post('/scheduled-reports', authenticate, ReportsController.createScheduledReport);
router.delete('/scheduled-reports/:id', authenticate, ReportsController.deleteScheduledReport);

export default router;
