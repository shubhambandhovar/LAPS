import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { CmsPage, CmsBanner, CmsMenu, MediaAsset, ThemeSettings } from '../models';
import {
  createCmsPageSchema,
  updateCmsPageSchema,
  createCmsBannerSchema,
  updateCmsBannerSchema,
  createCmsMenuSchema,
  updateCmsMenuSchema,
  createMediaAssetSchema,
  updateThemeSettingsSchema,
} from '@laps/shared';
// --- PAGES ---

export const getPages = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const pages = await CmsPage.find({ schoolId }).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', data: pages });
};

export const getPageById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.user!.schoolId;
  const page = await CmsPage.findOne({ _id: id, schoolId });
  if (!page) {
    return res.status(404).json({ status: 'error', message: 'Page not found', errorCode: 'RESOURCE_NOT_FOUND' });
  }
  res.status(200).json({ status: 'success', data: page });
};

export const createPage = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const input = createCmsPageSchema.parse(req.body);
  const { title, slug, content, status, seoMetadata } = input;

  const existingSlug = await CmsPage.findOne({ schoolId, slug });
  if (existingSlug) {
    return res.status(409).json({ status: 'error', message: 'Slug already exists', errorCode: 'DUPLICATE_RESOURCE' });
  }

  const page = await CmsPage.create({
    schoolId,
    title,
    slug,
    content,
    status: status || 'DRAFT',
    seoMetadata,
    authorId: new mongoose.Types.ObjectId(req.user!.id) as any,
    versionHistory: [{ version: 1, content, updatedBy: new mongoose.Types.ObjectId(req.user!.id) as any, updatedAt: new Date() }],
  });

  res.status(201).json({ status: 'success', data: page });
};

export const updatePage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.user!.schoolId;
  
  const page = await CmsPage.findOne({ _id: id, schoolId });
  if (!page) {
    return res.status(404).json({ status: 'error', message: 'Page not found', errorCode: 'RESOURCE_NOT_FOUND' });
  }

  const input = updateCmsPageSchema.parse(req.body);
  const { title, slug, content, status, seoMetadata } = input;

  if (slug && slug !== page.slug) {
    const existingSlug = await CmsPage.findOne({ schoolId, slug });
    if (existingSlug) {
      return res.status(409).json({ status: 'error', message: 'Slug already exists', errorCode: 'DUPLICATE_RESOURCE' });
    }
    page.slug = slug;
  }

  if (title) page.title = title;
  if (status) page.status = status;
  if (seoMetadata) page.seoMetadata = seoMetadata;
  
  if (content && content !== page.content) {
    page.content = content;
    const nextVersion = page.versionHistory.length > 0 ? page.versionHistory[page.versionHistory.length - 1].version + 1 : 1;
    page.versionHistory.push({ version: nextVersion, content, updatedBy: new mongoose.Types.ObjectId(req.user!.id) as any, updatedAt: new Date() });
  }

  await page.save();
  res.status(200).json({ status: 'success', data: page });
};

export const publishPage = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.user!.schoolId;
  
  const page = await CmsPage.findOne({ _id: id, schoolId });
  if (!page) {
    return res.status(404).json({ status: 'error', message: 'Page not found', errorCode: 'RESOURCE_NOT_FOUND' });
  }

  page.status = 'PUBLISHED';
  page.publishedAt = new Date();
  await page.save();

  res.status(200).json({ status: 'success', data: page });
};

// --- BANNERS ---

export const getBanners = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const banners = await CmsBanner.find({ schoolId }).sort({ displayOrder: 1 });
  res.status(200).json({ status: 'success', data: banners });
};

export const createBanner = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const input = createCmsBannerSchema.parse(req.body);
  const banner = await CmsBanner.create({ ...input, schoolId });
  res.status(201).json({ status: 'success', data: banner });
};

export const updateBanner = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.user!.schoolId;
  
  const input = updateCmsBannerSchema.parse(req.body);
  const banner = await CmsBanner.findOneAndUpdate(
    { _id: id, schoolId },
    { $set: input },
    { new: true }
  );

  if (!banner) {
    return res.status(404).json({ status: 'error', message: 'Banner not found', errorCode: 'RESOURCE_NOT_FOUND' });
  }
  res.status(200).json({ status: 'success', data: banner });
};

export const deleteBanner = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.user!.schoolId;
  
  const banner = await CmsBanner.findOneAndDelete({ _id: id, schoolId });
  if (!banner) {
    return res.status(404).json({ status: 'error', message: 'Banner not found', errorCode: 'RESOURCE_NOT_FOUND' });
  }
  res.status(200).json({ status: 'success', message: 'Banner deleted' });
};

// --- MENUS ---

export const getMenus = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const menus = await CmsMenu.find({ schoolId });
  res.status(200).json({ status: 'success', data: menus });
};

export const createMenu = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const input = createCmsMenuSchema.parse(req.body);
  const { location, items } = input;

  const existingMenu = await CmsMenu.findOne({ schoolId, location });
  if (existingMenu) {
    return res.status(409).json({ status: 'error', message: 'Menu location already exists', errorCode: 'DUPLICATE_RESOURCE' });
  }

  const menu = await CmsMenu.create({ schoolId, location, items });
  res.status(201).json({ status: 'success', data: menu });
};

export const updateMenu = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.user!.schoolId;
  
  const input = updateCmsMenuSchema.parse(req.body);
  const menu = await CmsMenu.findOneAndUpdate(
    { _id: id, schoolId },
    { $set: input },
    { new: true }
  );

  if (!menu) {
    return res.status(404).json({ status: 'error', message: 'Menu not found', errorCode: 'RESOURCE_NOT_FOUND' });
  }
  res.status(200).json({ status: 'success', data: menu });
};

// --- MEDIA ---

export const getMedia = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const media = await MediaAsset.find({ schoolId }).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', data: media });
};

export const uploadMedia = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const input = createMediaAssetSchema.parse(req.body);
  const media = await MediaAsset.create({
    ...input,
    schoolId,
    uploadedBy: new mongoose.Types.ObjectId(req.user!.id) as any,
  });
  res.status(201).json({ status: 'success', data: media });
};

export const deleteMedia = async (req: Request, res: Response) => {
  const { id } = req.params;
  const schoolId = req.user!.schoolId;
  
  const media = await MediaAsset.findOneAndDelete({ _id: id, schoolId });
  if (!media) {
    return res.status(404).json({ status: 'error', message: 'Media not found', errorCode: 'RESOURCE_NOT_FOUND' });
  }
  res.status(200).json({ status: 'success', message: 'Media deleted' });
};

// --- THEME ---

export const getThemeSettings = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  let theme = await ThemeSettings.findOne({ schoolId });
  if (!theme) {
    theme = await ThemeSettings.create({ schoolId });
  }
  res.status(200).json({ status: 'success', data: theme });
};

export const updateThemeSettings = async (req: Request, res: Response) => {
  const schoolId = req.user!.schoolId;
  const input = updateThemeSettingsSchema.parse(req.body);
  const theme = await ThemeSettings.findOneAndUpdate(
    { schoolId },
    { $set: input },
    { new: true, upsert: true }
  );
  res.status(200).json({ status: 'success', data: theme });
};
