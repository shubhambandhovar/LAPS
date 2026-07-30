import { Request, Response } from 'express';
import {
  CreateRouteSchema,
  UpdateRouteSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Route } from '../models/Route';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function createRoute(req: Request, res: Response): Promise<void> {
  const parsed = CreateRouteSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid route creation payload',
      parsed.error.errors,
    );
  }

  const existing = await Route.findOne({
    schoolId: (req.body.schoolId as string) || 'LAPS-GOHAD',
    $or: [
      { routeCode: parsed.data.routeCode.toUpperCase() },
      { routeName: parsed.data.routeName },
    ],
  });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      `Route with code ${parsed.data.routeCode} or name already exists`,
    );
  }

  const route = await Route.create({
    ...parsed.data,
    routeCode: parsed.data.routeCode.toUpperCase(),
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Route created successfully', route);
}

export async function getRoutes(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const schoolId = (req.query.schoolId as string) || 'LAPS-GOHAD';

  const filter: Record<string, unknown> = { schoolId };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.routeName) {
    filter.routeName = { $regex: req.query.routeName, $options: 'i' };
  }
  if (req.query.routeCode) {
    filter.routeCode = { $regex: req.query.routeCode, $options: 'i' };
  }

  const [routes, total] = await Promise.all([
    Route.find(filter)
      .sort({ routeCode: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Route.countDocuments(filter),
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

  sendSuccess(res, 200, 'Routes retrieved successfully', routes, meta);
}

export async function getRouteById(req: Request, res: Response): Promise<void> {
  const route = await Route.findById(req.params.id);
  if (!route) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Route not found');
  }

  sendSuccess(res, 200, 'Route retrieved successfully', route);
}

export async function updateRoute(req: Request, res: Response): Promise<void> {
  const parsed = UpdateRouteSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid route update payload',
      parsed.error.errors,
    );
  }

  const route = await Route.findById(req.params.id);
  if (!route) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Route not found');
  }

  if (parsed.data.routeCode) {
    parsed.data.routeCode = parsed.data.routeCode.toUpperCase();
  }

  Object.assign(route, {
    ...parsed.data,
    updatedBy: req.user?.id,
  });

  await route.save();

  sendSuccess(res, 200, 'Route updated successfully', route);
}

export async function deleteRoute(req: Request, res: Response): Promise<void> {
  const route = await Route.findById(req.params.id);
  if (!route) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Route not found');
  }

  route.status = 'ARCHIVED';
  await route.save();

  sendSuccess(res, 200, 'Route deleted successfully', route);
}
