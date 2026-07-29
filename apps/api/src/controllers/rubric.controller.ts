import { Request, Response } from 'express';
import {
  CreateRubricTemplateSchema,
  UpdateRubricTemplateSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { RubricTemplate } from '../models/RubricTemplate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/v1/rubrics
 * List reusable rubric templates scoped to teacher or shared departmental templates
 */
export async function getRubricList(req: Request, res: Response): Promise<void> {
  const {
    academicSessionId,
    subjectId,
    createdByTeacherId,
    isShared,
    page = '1',
    limit = '20',
  } = req.query;

  const filter: any = { status: { $ne: 'ARCHIVED' } };
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  if (subjectId) {
    filter.$or = [
      { subjectId },
      { subjectId: { $exists: false } },
      { subjectId: null },
    ];
  }
  if (createdByTeacherId) {
    if (String(isShared) === 'true') {
      filter.$or = [{ createdByTeacherId }, { isShared: true }];
    } else {
      filter.createdByTeacherId = createdByTeacherId;
    }
  } else if (String(isShared) === 'true') {
    filter.isShared = true;
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));

  const [items, totalRecords] = await Promise.all([
    RubricTemplate.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('subjectId', 'name code')
      .populate('createdByTeacherId', 'firstName lastName employeeId'),
    RubricTemplate.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalRecords / limitNum) || 1;
  const pagination: PaginationMeta = {
    page: pageNum,
    limit: limitNum,
    totalRecords,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  };

  sendSuccess(
    res,
    200,
    'Rubric templates retrieved successfully',
    items,
    pagination
  );
}

/**
 * POST /api/v1/rubrics
 * Create a reusable rubric template
 */
export async function createRubric(req: Request, res: Response): Promise<void> {
  const parseResult = CreateRubricTemplateSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0]?.message || 'Invalid rubric template payload'
    );
  }

  const data = parseResult.data;
  const user = (req as any).user;

  const totalMaxMarks = data.criteria.reduce(
    (sum, c) => sum + (c.maxMarks || 0),
    0
  );

  const newTemplate = await RubricTemplate.create({
    ...data,
    createdByTeacherId: data.createdByTeacherId || user.profileRef || user.id || user.userId || user._id,
    totalMaxMarks,
    createdBy: user.id || user.userId || user._id,
    updatedBy: user.id || user.userId || user._id,
  });

  sendSuccess(res, 201, 'Rubric template created successfully', newTemplate);
}

/**
 * PUT /api/v1/rubrics/:id
 * Update rubric template criteria or sharing status
 */
export async function updateRubric(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = UpdateRubricTemplateSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0]?.message || 'Invalid update payload'
    );
  }

  const template = await RubricTemplate.findOne({
    _id: id,
    status: { $ne: 'ARCHIVED' },
  });

  if (!template) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Rubric template not found');
  }

  const user = (req as any).user;
  const newCriteria = parseResult.data.criteria || template.criteria;
  const totalMaxMarks = newCriteria.reduce(
    (sum, c) => sum + (c.maxMarks || 0),
    0
  );

  Object.assign(template, {
    ...parseResult.data,
    criteria: newCriteria,
    totalMaxMarks,
    updatedBy: user.id || user.userId || user._id,
  });

  await template.save();
  sendSuccess(res, 200, 'Rubric template updated successfully', template);
}

/**
 * PATCH /api/v1/rubrics/:id/archive
 * Soft-archive rubric template
 */
export async function archiveRubric(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = (req as any).user;

  const template = await RubricTemplate.findOne({
    _id: id,
    status: { $ne: 'ARCHIVED' },
  });

  if (!template) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Rubric template not found');
  }

  template.status = 'ARCHIVED';
  template.archivedBy = user.id || user.userId || user._id;
  template.archivedAt = new Date();
  template.updatedBy = user.id || user.userId || user._id;

  await template.save();
  sendSuccess(res, 200, 'Rubric template archived successfully', {
    id: template._id,
    status: 'ARCHIVED',
  });
}
