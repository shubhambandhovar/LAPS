import { Request, Response } from 'express';
import {
  CreateReportCardTemplateSchema,
  UpdateReportCardTemplateSchema,
  ErrorCodes,
} from '@laps/shared';
import { ReportCardTemplate } from '../models/ReportCardTemplate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listReportCardTemplates = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, status, isDefault } = req.query;

  const query: Record<string, any> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (status) query.status = status;
  if (isDefault !== undefined) query.isDefault = isDefault === 'true';

  const templates = await ReportCardTemplate.find(query).sort({ isDefault: -1, name: 1 });
  sendSuccess(res, 200, 'Report card templates retrieved successfully', templates);
};

export const getReportCardTemplateById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const template = await ReportCardTemplate.findById(id);

  if (!template || template.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Report card template not found');
  }

  sendSuccess(res, 200, 'Report card template retrieved successfully', template);
};

export const createReportCardTemplate = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateReportCardTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid report card template payload',
      parsed.error.errors
    );
  }

  const existing = await ReportCardTemplate.findOne({
    name: parsed.data.name,
    academicSessionId: parsed.data.academicSessionId,
    status: { $ne: 'ARCHIVED' },
  });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'A report card template with this name already exists in this session'
    );
  }

  if (parsed.data.isDefault) {
    await ReportCardTemplate.updateMany(
      { academicSessionId: parsed.data.academicSessionId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const template = await ReportCardTemplate.create({
    ...parsed.data,
    status: parsed.data.status || 'ACTIVE',
    createdBy: (req as any).user.id,
    updatedBy: (req as any).user.id,
  });

  sendSuccess(res, 201, 'Report card template created successfully', template);
};

export const updateReportCardTemplate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = UpdateReportCardTemplateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid update payload',
      parsed.error.errors
    );
  }

  const template = await ReportCardTemplate.findById(id);
  if (!template || template.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Report card template not found');
  }

  if (parsed.data.name && parsed.data.name !== template.name) {
    const existing = await ReportCardTemplate.findOne({
      name: parsed.data.name,
      academicSessionId: template.academicSessionId,
      _id: { $ne: id },
      status: { $ne: 'ARCHIVED' },
    });
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        'A report card template with this name already exists in this session'
      );
    }
  }

  if (parsed.data.isDefault) {
    await ReportCardTemplate.updateMany(
      { academicSessionId: template.academicSessionId, isDefault: true, _id: { $ne: id } },
      { $set: { isDefault: false } }
    );
  }

  Object.assign(template, parsed.data, {
    updatedBy: (req as any).user.id,
  });

  await template.save();
  sendSuccess(res, 200, 'Report card template updated successfully', template);
};

export const setDefaultReportCardTemplate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const template = await ReportCardTemplate.findById(id);
  if (!template || template.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Report card template not found');
  }

  await ReportCardTemplate.updateMany(
    { academicSessionId: template.academicSessionId, isDefault: true },
    { $set: { isDefault: false } }
  );

  template.isDefault = true;
  template.updatedBy = (req as any).user.id;
  await template.save();

  sendSuccess(res, 200, 'Template marked as default successfully', template);
};

export const archiveReportCardTemplate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const template = await ReportCardTemplate.findById(id);

  if (!template || template.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Report card template not found');
  }

  template.status = 'ARCHIVED';
  template.archivedAt = new Date();
  template.archivedBy = (req as any).user.id;
  template.updatedBy = (req as any).user.id;

  await template.save();
  sendSuccess(res, 200, 'Report card template archived successfully', template);
};
