import { Request, Response } from 'express';
import {
  CreateNotificationTemplateSchema,
  UpdateNotificationTemplateSchema,
  TemplatePreviewSchema,
  ErrorCodes,
} from '@laps/shared';
import { NotificationTemplate } from '../models/NotificationTemplate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * Helper to interpolate Mustache/Handlebars placeholders {{varName}} in text
 */
export function interpolateVariables(templateText: string, variables: Record<string, any> = {}): string {
  return templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : `[${key}]`;
  });
}

export const listTemplates = async (req: Request, res: Response): Promise<void> => {
  const { category, isActive, locale = 'en' } = req.query;
  const query: Record<string, unknown> = { locale };

  if (category && category !== 'ALL') {
    query.category = category;
  }
  if (isActive !== undefined && isActive !== 'ALL') {
    query.isActive = isActive === 'true';
  }

  const templates = await NotificationTemplate.find(query).sort({ code: 1 });

  sendSuccess(res, 200, 'Notification templates retrieved successfully', templates);
};

export const getTemplateByCode = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;
  const { locale = 'en' } = req.query;

  const template = await NotificationTemplate.findOne({
    code: code.toUpperCase(),
    locale: locale.toString(),
  });

  if (!template) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, `Notification template ${code} not found`);
  }

  sendSuccess(res, 200, 'Notification template retrieved successfully', template);
};

export const createTemplate = async (req: Request, res: Response): Promise<void> => {
  const validated = CreateNotificationTemplateSchema.parse(req.body);

  const existing = await NotificationTemplate.findOne({
    code: validated.code.toUpperCase(),
    locale: validated.locale || 'en',
  });

  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Template code "${validated.code}" with locale "${validated.locale || 'en'}" already exists`
    );
  }

  const template = await NotificationTemplate.create({
    ...validated,
    code: validated.code.toUpperCase(),
    createdBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Notification template created successfully', template);
};

export const updateTemplate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = UpdateNotificationTemplateSchema.parse(req.body);

  const template = await NotificationTemplate.findByIdAndUpdate(
    id,
    { $set: validated },
    { new: true, runValidators: true }
  );

  if (!template) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notification template not found');
  }

  sendSuccess(res, 200, 'Notification template updated successfully', template);
};

export const previewTemplate = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = TemplatePreviewSchema.parse(req.body);

  const template = await NotificationTemplate.findById(id);
  if (!template) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notification template not found');
  }

  const renderedSubject = template.subjectTemplate
    ? interpolateVariables(template.subjectTemplate, validated.variables)
    : undefined;
  const renderedBody = interpolateVariables(template.bodyTemplate, validated.variables);

  sendSuccess(res, 200, 'Template rendering preview generated', {
    renderedSubject,
    renderedBody,
    variablesUsed: validated.variables,
  });
};
