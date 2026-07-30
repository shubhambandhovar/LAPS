import { Request, Response } from 'express';
import {
  CreateVehicleSchema,
  UpdateVehicleSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Vehicle } from '../models/Vehicle';
import { StudentTransportAssignment } from '../models/StudentTransportAssignment';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function createVehicle(req: Request, res: Response): Promise<void> {
  const parsed = CreateVehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid vehicle creation payload',
      parsed.error.errors,
    );
  }

  const existing = await Vehicle.findOne({
    schoolId: (req.body.schoolId as string) || 'LAPS-GOHAD',
    registrationNumber: parsed.data.registrationNumber.toUpperCase(),
  });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      `Vehicle with registration number ${parsed.data.registrationNumber} already exists`,
    );
  }

  const vehicle = await Vehicle.create({
    ...parsed.data,
    registrationNumber: parsed.data.registrationNumber.toUpperCase(),
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Vehicle created successfully', vehicle);
}

export async function getVehicles(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const schoolId = (req.query.schoolId as string) || 'LAPS-GOHAD';

  const filter: Record<string, unknown> = { schoolId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.vehicleType) filter.vehicleType = req.query.vehicleType;
  if (req.query.registrationNumber) {
    filter.registrationNumber = { $regex: req.query.registrationNumber, $options: 'i' };
  }

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter)
      .sort({ registrationNumber: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Vehicle.countDocuments(filter),
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

  sendSuccess(res, 200, 'Vehicles retrieved successfully', vehicles, meta);
}

export async function getVehicleById(req: Request, res: Response): Promise<void> {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Vehicle not found');
  }

  sendSuccess(res, 200, 'Vehicle retrieved successfully', vehicle);
}

export async function updateVehicle(req: Request, res: Response): Promise<void> {
  const parsed = UpdateVehicleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid vehicle update payload',
      parsed.error.errors,
    );
  }

  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Vehicle not found');
  }

  if (parsed.data.capacity !== undefined && parsed.data.capacity < vehicle.capacity) {
    const activeCount = await StudentTransportAssignment.countDocuments({
      vehicleId: vehicle._id,
      status: 'ACTIVE',
    });
    if (activeCount > parsed.data.capacity) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Cannot reduce capacity below current active assignment count (${activeCount})`,
      );
    }
  }

  if (parsed.data.registrationNumber) {
    parsed.data.registrationNumber = parsed.data.registrationNumber.toUpperCase();
  }

  Object.assign(vehicle, {
    ...parsed.data,
    updatedBy: req.user?.id,
  });

  await vehicle.save();

  sendSuccess(res, 200, 'Vehicle updated successfully', vehicle);
}

export async function deleteVehicle(req: Request, res: Response): Promise<void> {
  const vehicle = await Vehicle.findById(req.params.id);
  if (!vehicle) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Vehicle not found');
  }

  vehicle.status = 'RETIRED';
  vehicle.archivedBy = req.user?.id as any;
  vehicle.archivedAt = new Date();
  await vehicle.save();

  sendSuccess(res, 200, 'Vehicle deleted successfully', vehicle);
}
