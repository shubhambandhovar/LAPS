import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import * as cmsController from '../controllers/cms.controller';

const router = Router();

// Protect all CMS routes
router.use(authenticate);

// --- PAGES ---
router.get('/pages', requirePermission('CMS', 'UPDATE', 'cms'), cmsController.getPages);
router.post(
  '/pages',
  requirePermission('CMS', 'UPDATE', 'cms'),
  cmsController.createPage
);
router.get('/pages/:id', requirePermission('CMS', 'UPDATE', 'cms'), cmsController.getPageById);
router.put(
  '/pages/:id',
  requirePermission('CMS', 'UPDATE', 'cms'),
  cmsController.updatePage
);
router.post('/pages/:id/publish', requirePermission('CMS', 'UPDATE', 'cms'), cmsController.publishPage);

// --- BANNERS ---
router.get('/banners', requirePermission('CMS', 'UPDATE', 'cms'), cmsController.getBanners);
router.post(
  '/banners',
  requirePermission('CMS', 'UPDATE', 'cms'),
  cmsController.createBanner
);
router.put(
  '/banners/:id',
  requirePermission('CMS', 'UPDATE', 'cms'),
  cmsController.updateBanner
);
router.delete('/banners/:id', requirePermission('CMS', 'UPDATE', 'cms'), cmsController.deleteBanner);

// --- MENUS ---
router.get('/menus', requirePermission('CMS', 'UPDATE', 'cms'), cmsController.getMenus);
router.post(
  '/menus',
  requirePermission('CMS', 'UPDATE', 'cms'),
  cmsController.createMenu
);
router.put(
  '/menus/:id',
  requirePermission('CMS', 'UPDATE', 'cms'),
  cmsController.updateMenu
);

// --- MEDIA ---
router.get('/media', requirePermission('CMS', 'UPDATE', 'cms'), cmsController.getMedia);
router.post(
  '/media',
  requirePermission('CMS', 'UPDATE', 'cms'),
  cmsController.uploadMedia
);
router.delete('/media/:id', requirePermission('CMS', 'UPDATE', 'cms'), cmsController.deleteMedia);

// --- THEME ---
router.get('/theme', requirePermission('CMS', 'UPDATE', 'cms'), cmsController.getThemeSettings);
router.put(
  '/theme',
  requirePermission('CMS', 'UPDATE', 'cms'),
  cmsController.updateThemeSettings
);

export default router;
