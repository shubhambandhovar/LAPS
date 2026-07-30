import { Request, Response } from 'express';
import {
  CreateMaintenanceRecordSchema,
  UpdateMaintenanceRecordSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { MaintenanceRecord } from '../models/MaintenanceRecord';
import { Vehicle } from '../models/Vehicle';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function createMaintenanceRecord(req: Request, res: Response): Promise<void> {
  const parsed = CreateMaintenanceRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid maintenance record creation payload',
      parsed.error.errors,
    );
  }

  const vehicle = await Vehicle.findById(parsed.data.vehicleId);
  if (!vehicle) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Vehicle not found');
  }

  const record = await MaintenanceRecord.create({
    ...parsed.data,
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  // Transition vehicle status to MAINTENANCE if in progress or scheduled (TEST-TRN-005)
  if (
    record.status === 'IN_PROGRESS' ||
    record.status === 'SCHEDULED' ||
    record.maintenanceType === 'SERVICE_SCHEDULE' ||
    record.maintenanceType === 'REPAIR'
  ) {
    if (vehicle.status !== 'MAINTENANCE') {
      vehicle.status = 'MAINTENANCE';
      await vehicle.save();
    }
  }

  sendSuccess(res, 201, 'Maintenance record created successfully', record);
}

export async function getMaintenanceRecords(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const schoolId = (req.query.schoolId as string) || 'LAPS-GOHAD';

  const filter: Record<string, unknown> = { schoolId };
  if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
  if (req.query.maintenanceType) filter.maintenanceType = req.query.maintenanceType;
  if (req.query.status) filter.status = req.query.status;

  const [records, total] = await Promise.all([
    MaintenanceRecord.find(filter)
      .sort({ serviceDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    MaintenanceRecord.countDocuments(filter),
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

  sendSuccess(res, 200, 'Maintenance records retrieved successfully', records, meta);
}

export async function getMaintenanceRecordById(req: Request, res: Response): Promise<void> {
  const record = await MaintenanceRecord.findById(req.params.id);
  if (!record) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Maintenance record not found');
  }

  sendSuccess(res, 200, 'Maintenance record retrieved successfully', record);
}

export async function updateMaintenanceRecord(req: Request, res: Response): Promise<void> {
  const parsed = UpdateMaintenanceRecordSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid maintenance update payload',
      parsed.error.errors,
    );
  }

  const record = await MaintenanceRecord.findById(req.params.id);
  if (!record) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Maintenance record not found');
  }

  Object.assign(record, {
    ...parsed.data,
    updatedBy: req.user?.id,
  });

  await record.save();

  if (record.status === 'COMPLETED') {
    const pendingCount = await MaintenanceRecord.countDocuments({
      vehicleId: record.vehicleId,
      status: { $in: ['IN_PROGRESS', 'SCHEDULED'] },
    });
    if (pendingCount === 0) {
      await Vehicle.findByIdAndUpdate(record.vehicleId, { status: 'ACTIVE' });
    }
  }

  sendSuccess(res, 200, 'Maintenance record updated successfully', record);
}

export async function deleteMaintenanceRecord(req: Request, res: Response): Promise<void> {
  const record = await MaintenanceRecord.findById(req.params.id);
  if (!record) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Maintenance record not found');
  }

  record.status = 'CANCELLED';
  await record.save();

  sendSuccess(res, 200, 'Maintenance record deleted successfully', record);
}
