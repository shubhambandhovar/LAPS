import { Request, Response } from 'express';
import {
  CreateDriverSchema,
  UpdateDriverSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Driver } from '../models/Driver';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function createDriver(req: Request, res: Response): Promise<void> {
  const parsed = CreateDriverSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid driver creation payload',
      parsed.error.errors,
    );
  }

  const existing = await Driver.findOne({
    schoolId: (req.body.schoolId as string) || 'LAPS-GOHAD',
    'licenseDetails.licenseNumber': parsed.data.licenseDetails.licenseNumber,
  });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      `Driver with license number ${parsed.data.licenseDetails.licenseNumber} already exists`,
    );
  }

  const driver = await Driver.create({
    ...parsed.data,
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Driver created successfully', driver);
}

export async function getDrivers(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const schoolId = (req.query.schoolId as string) || 'LAPS-GOHAD';

  const filter: Record<string, unknown> = { schoolId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.licenseNumber) {
    filter['licenseDetails.licenseNumber'] = { $regex: req.query.licenseNumber, $options: 'i' };
  }
  if (req.query.name) {
    filter.$or = [
      { 'driverProfile.firstName': { $regex: req.query.name, $options: 'i' } },
      { 'driverProfile.lastName': { $regex: req.query.name, $options: 'i' } },
    ];
  }

  const [drivers, total] = await Promise.all([
    Driver.find(filter)
      .sort({ 'driverProfile.firstName': 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Driver.countDocuments(filter),
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

  sendSuccess(res, 200, 'Drivers retrieved successfully', drivers, meta);
}

export async function getDriverById(req: Request, res: Response): Promise<void> {
  const driver = await Driver.findById(req.params.id);
  if (!driver) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Driver not found');
  }

  sendSuccess(res, 200, 'Driver retrieved successfully', driver);
}

export async function updateDriver(req: Request, res: Response): Promise<void> {
  const parsed = UpdateDriverSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid driver update payload',
      parsed.error.errors,
    );
  }

  const driver = await Driver.findById(req.params.id);
  if (!driver) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Driver not found');
  }

  Object.assign(driver, {
    ...parsed.data,
    updatedBy: req.user?.id,
  });

  await driver.save();

  sendSuccess(res, 200, 'Driver updated successfully', driver);
}

export async function deleteDriver(req: Request, res: Response): Promise<void> {
  const driver = await Driver.findById(req.params.id);
  if (!driver) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Driver not found');
  }

  driver.status = 'INACTIVE';
  await driver.save();

  sendSuccess(res, 200, 'Driver deleted successfully', driver);
}
