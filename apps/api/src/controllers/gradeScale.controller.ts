import { Request, Response } from 'express';
import {
  CreateGradeScaleSchema,
  UpdateGradeScaleSchema,
  ErrorCodes,
} from '@laps/shared';
import { GradeScale } from '../models/GradeScale';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listGradeScales = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, status } = req.query;

  const query: Record<string, any> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (status) query.status = status;

  const scales = await GradeScale.find(query).sort({ isDefault: -1, name: 1 });

  sendSuccess(res, 200, 'Grade scales retrieved successfully', scales);
};

export const getGradeScaleById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const scale = await GradeScale.findById(id);

  if (!scale || scale.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Grade scale not found');
  }

  sendSuccess(res, 200, 'Grade scale retrieved successfully', scale);
};

export const createGradeScale = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateGradeScaleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid grade scale payload', parsed.error.errors);
  }

  if (parsed.data.isDefault) {
    await GradeScale.updateMany(
      { academicSessionId: parsed.data.academicSessionId, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const scale = await GradeScale.create({
    ...parsed.data,
    status: parsed.data.status || 'ACTIVE',
    createdBy: (req as any).user.id,
    updatedBy: (req as any).user.id,
  });

  sendSuccess(res, 201, 'Grade scale created successfully', scale);
};

export const updateGradeScale = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = UpdateGradeScaleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid update payload', parsed.error.errors);
  }

  const scale = await GradeScale.findById(id);
  if (!scale || scale.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Grade scale not found');
  }

  if (parsed.data.isDefault) {
    await GradeScale.updateMany(
      { academicSessionId: scale.academicSessionId, isDefault: true, _id: { $ne: id } },
      { $set: { isDefault: false } }
    );
  }

  Object.assign(scale, parsed.data, {
    updatedBy: (req as any).user.id,
  });

  await scale.save();
  sendSuccess(res, 200, 'Grade scale updated successfully', scale);
};

export const archiveGradeScale = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const scale = await GradeScale.findById(id);

  if (!scale || scale.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Grade scale not found');
  }

  scale.status = 'ARCHIVED';
  scale.updatedBy = (req as any).user.id;

  await scale.save();
  sendSuccess(res, 200, 'Grade scale archived successfully', scale);
};
