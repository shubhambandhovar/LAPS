import { Router } from 'express';
import * as publicController from '../controllers/public.controller';

const router = Router();

// These endpoints are read-only and unauthenticated.
// Suitable for fetching data for the public school website.

router.get('/theme', publicController.getThemeSettings);
router.get('/menus', publicController.getMenus);
router.get('/banners', publicController.getBanners);
router.get('/pages/:slug', publicController.getPageBySlug);
router.get('/news', publicController.getPublicNewsAndEvents);
router.get('/notices', publicController.getPublicNotices);

export default router;
