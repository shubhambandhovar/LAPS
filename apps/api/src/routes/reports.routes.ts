import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Analytics & Dashboard (Only SUPER_ADMIN, SCHOOL_ADMIN, and relevant roles based on UI)
// For simplicity, we can let the UI restrict or specific controllers check further.
router.get('/dashboard/executive', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), ReportsController.getExecutiveDashboard);
router.get('/analytics/:module', ReportsController.getModuleAnalytics);

// Report Generation and Export
router.post('/reports/generate', ReportsController.generateReport);
router.post('/reports/export', ReportsController.exportReport);

// Report Templates
router.get('/report-templates', ReportsController.getTemplates);
router.post('/report-templates', requireRole(['SUPER_ADMIN', 'SCHOOL_ADMIN']), ReportsController.createTemplate);

// Saved Reports
router.get('/reports/saved', ReportsController.getSavedReports);
router.post('/reports/saved', ReportsController.createSavedReport);

// Scheduled Reports
router.get('/scheduled-reports', ReportsController.getScheduledReports);
router.post('/scheduled-reports', ReportsController.createScheduledReport);
router.delete('/scheduled-reports/:id', ReportsController.deleteScheduledReport);

export default router;
