import { Request, Response } from 'express';
import {
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { StudentTransportAssignment } from '../models/StudentTransportAssignment';
import { Vehicle } from '../models/Vehicle';
import { Route } from '../models/Route';
import { Stop } from '../models/Stop';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function createAssignment(req: Request, res: Response): Promise<void> {
  const parsed = CreateAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid assignment creation payload',
      parsed.error.errors,
    );
  }

  // Check 1: Archived Route validation (TEST-TRN-010)
  const route = await Route.findById(parsed.data.routeId);
  if (!route) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Route not found');
  }
  if (route.status === 'ARCHIVED') {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Cannot assign student to an archived route',
    );
  }

  // Check 2: Duplicate Assignment check (TEST-TRN-003)
  const existingAssignment = await StudentTransportAssignment.findOne({
    studentId: parsed.data.studentId,
    academicSessionId: parsed.data.academicSessionId,
    status: 'ACTIVE',
  });
  if (existingAssignment) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'Student already has an active transport assignment for this academic session',
    );
  }

  // Check 3: Vehicle Capacity validation (TEST-TRN-004)
  const vehicle = await Vehicle.findById(parsed.data.vehicleId);
  if (!vehicle) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Vehicle not found');
  }
  const activeCount = await StudentTransportAssignment.countDocuments({
    vehicleId: vehicle._id,
    status: 'ACTIVE',
  });
  if (activeCount >= vehicle.capacity) {
    throw new AppError(409, ErrorCodes.VALIDATION_ERROR, 'Vehicle capacity exceeded');
  }

  // Check 4: Validate Stop
  const stop = await Stop.findById(parsed.data.stopId);
  if (!stop) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Stop not found');
  }

  const assignment = await StudentTransportAssignment.create({
    ...parsed.data,
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  // Increment stop studentCount
  await Stop.findByIdAndUpdate(stop._id, { $inc: { studentCount: 1 } });

  sendSuccess(res, 201, 'Assignment created successfully', assignment);
}

export async function getAssignments(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const schoolId = (req.query.schoolId as string) || 'LAPS-GOHAD';

  const filter: Record<string, unknown> = { schoolId };
  if (req.query.studentId) filter.studentId = req.query.studentId;
  if (req.query.enrollmentId) filter.enrollmentId = req.query.enrollmentId;
  if (req.query.academicSessionId) filter.academicSessionId = req.query.academicSessionId;
  if (req.query.routeId) filter.routeId = req.query.routeId;
  if (req.query.stopId) filter.stopId = req.query.stopId;
  if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
  if (req.query.status) filter.status = req.query.status;

  const [assignments, total] = await Promise.all([
    StudentTransportAssignment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    StudentTransportAssignment.countDocuments(filter),
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

  sendSuccess(res, 200, 'Assignments retrieved successfully', assignments, meta);
}

export async function getAssignmentById(req: Request, res: Response): Promise<void> {
  const assignment = await StudentTransportAssignment.findById(req.params.id);
  if (!assignment) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Assignment not found');
  }

  sendSuccess(res, 200, 'Assignment retrieved successfully', assignment);
}

export async function updateAssignment(req: Request, res: Response): Promise<void> {
  const parsed = UpdateAssignmentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid assignment update payload',
      parsed.error.errors,
    );
  }

  const assignment = await StudentTransportAssignment.findById(req.params.id);
  if (!assignment) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Assignment not found');
  }

  const wasActive = assignment.status === 'ACTIVE';
  Object.assign(assignment, {
    ...parsed.data,
    updatedBy: req.user?.id,
  });

  const isNowActive = assignment.status === 'ACTIVE';

  await assignment.save();

  if (wasActive && !isNowActive) {
    await Stop.findByIdAndUpdate(assignment.stopId, {
      $inc: { studentCount: -1 },
    });
  } else if (!wasActive && isNowActive) {
    await Stop.findByIdAndUpdate(assignment.stopId, {
      $inc: { studentCount: 1 },
    });
  }

  sendSuccess(res, 200, 'Assignment updated successfully', assignment);
}

export async function deleteAssignment(req: Request, res: Response): Promise<void> {
  const assignment = await StudentTransportAssignment.findById(req.params.id);
  if (!assignment) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Assignment not found');
  }

  if (assignment.status === 'ACTIVE') {
    await Stop.findByIdAndUpdate(assignment.stopId, {
      $inc: { studentCount: -1 },
    });
  }

  assignment.status = 'CANCELLED';
  await assignment.save();

  sendSuccess(res, 200, 'Assignment deleted successfully', assignment);
}
