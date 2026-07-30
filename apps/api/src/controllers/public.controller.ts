import { Request, Response } from 'express';
import { CmsPage, CmsBanner, CmsMenu, ThemeSettings, Notice, SchoolEvent } from '../models';

const DEFAULT_SCHOOL_ID = 'LAPS-GOHAD';

export const getThemeSettings = async (_req: Request, res: Response) => {
  let theme = await ThemeSettings.findOne({ schoolId: DEFAULT_SCHOOL_ID });
  if (!theme) {
    theme = await ThemeSettings.create({ schoolId: DEFAULT_SCHOOL_ID });
  }
  res.status(200).json({ status: 'success', data: theme });
};

export const getMenus = async (_req: Request, res: Response) => {
  const menus = await CmsMenu.find({ schoolId: DEFAULT_SCHOOL_ID });
  res.status(200).json({ status: 'success', data: menus });
};

export const getBanners = async (req: Request, res: Response) => {
  const { position } = req.query;
  const filter: any = { schoolId: DEFAULT_SCHOOL_ID, status: 'ACTIVE' };
  if (position) {
    filter.position = position;
  }
  const banners = await CmsBanner.find(filter).sort({ displayOrder: 1 });
  res.status(200).json({ status: 'success', data: banners });
};

export const getPageBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const page = await CmsPage.findOne({ schoolId: DEFAULT_SCHOOL_ID, slug, status: 'PUBLISHED' }).select('-versionHistory -authorId');
  
  if (!page) {
    return res.status(404).json({ status: 'error', message: 'Page not found or not published', errorCode: 'RESOURCE_NOT_FOUND' });
  }
  res.status(200).json({ status: 'success', data: page });
};

export const getPublicNewsAndEvents = async (req: Request, res: Response) => {
  // Aggregate both Events and Notices (if desired) or just Events marked as public
  const limit = parseInt(req.query.limit as string) || 10;
  
  const events = await SchoolEvent.find({
    schoolId: DEFAULT_SCHOOL_ID,
    visibility: 'PUBLIC',
    status: { $ne: 'CANCELLED' }
  })
    .sort({ startDate: 1 })
    .limit(limit)
    .select('title description startDate endDate location type');
    
  res.status(200).json({ status: 'success', data: events });
};

export const getPublicNotices = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 10;
  
  // Assuming 'GLOBAL' targetRoles or specific public flags. 
  // For now, we will assume any published notice without specific targetRoles is public, or we just take all PUBLISHED
  const notices = await Notice.find({
    schoolId: DEFAULT_SCHOOL_ID,
    status: 'PUBLISHED'
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .select('title content publishedAt expiryDate priority attachments');
    
  res.status(200).json({ status: 'success', data: notices });
};
