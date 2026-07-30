import { Request, Response } from 'express';
import {
  CreateStopSchema,
  UpdateStopSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Stop } from '../models/Stop';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function createStop(req: Request, res: Response): Promise<void> {
  const parsed = CreateStopSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid stop creation payload',
      parsed.error.errors,
    );
  }

  const existing = await Stop.findOne({
    schoolId: (req.body.schoolId as string) || 'LAPS-GOHAD',
    stopCode: parsed.data.stopCode.toUpperCase(),
  });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      `Stop with code ${parsed.data.stopCode} already exists`,
    );
  }

  const stop = await Stop.create({
    ...parsed.data,
    stopCode: parsed.data.stopCode.toUpperCase(),
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Stop created successfully', stop);
}

export async function getStops(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const schoolId = (req.query.schoolId as string) || 'LAPS-GOHAD';

  const filter: Record<string, unknown> = { schoolId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.stopName) {
    filter.stopName = { $regex: req.query.stopName, $options: 'i' };
  }
  if (req.query.stopCode) {
    filter.stopCode = { $regex: req.query.stopCode, $options: 'i' };
  }

  const [stops, total] = await Promise.all([
    Stop.find(filter)
      .sort({ stopName: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Stop.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;
  const meta: PaginationMeta = {
    page,
    limit,
    totalRecords: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  sendSuccess(res, 200, 'Stops retrieved successfully', stops, meta);
}

export async function getStopById(req: Request, res: Response): Promise<void> {
  const stop = await Stop.findById(req.params.id);
  if (!stop) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Stop not found');
  }

  sendSuccess(res, 200, 'Stop retrieved successfully', stop);
}

export async function updateStop(req: Request, res: Response): Promise<void> {
  const parsed = UpdateStopSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid stop update payload',
      parsed.error.errors,
    );
  }

  const stop = await Stop.findById(req.params.id);
  if (!stop) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Stop not found');
  }

  if (parsed.data.stopCode) {
    parsed.data.stopCode = parsed.data.stopCode.toUpperCase();
  }

  Object.assign(stop, {
    ...parsed.data,
    updatedBy: req.user?.id,
  });

  await stop.save();

  sendSuccess(res, 200, 'Stop updated successfully', stop);
}

export async function deleteStop(req: Request, res: Response): Promise<void> {
  const stop = await Stop.findById(req.params.id);
  if (!stop) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Stop not found');
  }

  stop.status = 'ARCHIVED';
  await stop.save();

  sendSuccess(res, 200, 'Stop deleted successfully', stop);
}
