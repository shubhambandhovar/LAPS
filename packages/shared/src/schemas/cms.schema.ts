import { z } from 'zod';

export const seoMetadataSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  openGraphImageUrl: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
  robots: z.string().optional(),
});

export const createCmsPageSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  content: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  seoMetadata: seoMetadataSchema.optional(),
});

export const updateCmsPageSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  slug: z.string().min(2).max(200).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  seoMetadata: seoMetadataSchema.optional(),
});

export const createCmsBannerSchema = z.object({
  title: z.string().min(2).max(200),
  imageUrl: z.string().url(),
  linkUrl: z.string().optional(),
  position: z.string().min(2).max(50),
  displayOrder: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateCmsBannerSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().optional(),
  position: z.string().min(2).max(50).optional(),
  displayOrder: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const cmsMenuItemSchema = z.object({
  label: z.string().min(1),
  url: z.string().min(1),
  displayOrder: z.number().int().min(0).optional(),
  parentId: z.string().optional(), // Used for nested menus
});

export const createCmsMenuSchema = z.object({
  location: z.string().min(2).max(50),
  items: z.array(cmsMenuItemSchema).optional(),
});

export const updateCmsMenuSchema = z.object({
  location: z.string().min(2).max(50).optional(),
  items: z.array(cmsMenuItemSchema).optional(),
});

export const createMediaAssetSchema = z.object({
  url: z.string().url(),
  originalName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().min(0),
  category: z.enum(['IMAGE', 'DOCUMENT', 'VIDEO']),
  tags: z.array(z.string()).optional(),
});

export const updateThemeSettingsSchema = z.object({
  logoUrl: z.string().url().optional(),
  faviconUrl: z.string().url().optional(),
  colors: z.object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    accent: z.string().optional(),
  }).optional(),
  socialLinks: z.object({
    facebook: z.string().url().optional(),
    twitter: z.string().url().optional(),
    instagram: z.string().url().optional(),
    youtube: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  }).optional(),
  footerText: z.string().optional(),
  contactInfo: z.object({
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    googleMapEmbedUrl: z.string().optional(),
  }).optional(),
});
