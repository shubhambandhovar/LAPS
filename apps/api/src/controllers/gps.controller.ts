import { Request, Response } from 'express';
import {
  GpsTelemetrySchema,
  ErrorCodes,
} from '@laps/shared';
import { GpsLocation } from '../models/GpsLocation';
import { Route } from '../models/Route';
import { Stop } from '../models/Stop';
import { StudentTransportAssignment } from '../models/StudentTransportAssignment';
import { StudentGuardian } from '../models/StudentGuardian';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (val: number) => (val * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export async function ingestTelemetry(req: Request, res: Response): Promise<void> {
  const parsed = GpsTelemetrySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid GPS telemetry payload',
      parsed.error.errors,
    );
  }

  const { vehicleId, routeId, driverId, coordinates, speedKmh, headingDegrees, lastKnownLocationAddress } =
    parsed.data;

  let nextStopId: any = undefined;
  let distanceRemainingKm = 0;
  let etaMinutes = 0;
  let isOffRoute = false;

  if (routeId) {
    const route = await Route.findById(routeId).populate('stops.stopId');
    if (route && route.stops.length > 0) {
      // Find nearest or next stop
      let minDistance = Number.MAX_VALUE;
      for (const item of route.stops) {
        const stopDoc = await Stop.findById(item.stopId);
        if (stopDoc) {
          const dist = calculateHaversineKm(
            coordinates.latitude,
            coordinates.longitude,
            stopDoc.gpsCoordinates.latitude,
            stopDoc.gpsCoordinates.longitude,
          );
          if (dist < minDistance) {
            minDistance = dist;
            nextStopId = stopDoc._id;
          }
        }
      }

      distanceRemainingKm = minDistance !== Number.MAX_VALUE ? minDistance : 0;
      const effectiveSpeed = speedKmh && speedKmh > 0 ? speedKmh : 30; // Assume 30 km/h default
      etaMinutes = Math.round((distanceRemainingKm / effectiveSpeed) * 60);
      if (distanceRemainingKm > 50) {
        isOffRoute = true;
      }
    }
  }

  const gpsDoc = await GpsLocation.create({
    schoolId: 'LAPS-GOHAD',
    vehicleId,
    routeId,
    driverId,
    timestamp: new Date(),
    coordinates,
    speedKmh,
    headingDegrees,
    lastKnownLocationAddress,
    routeProgress: {
      nextStopId,
      etaMinutes,
      distanceRemainingKm,
      isOffRoute,
    },
    status: speedKmh > 0 ? 'LIVE' : 'IDLE',
  });

  sendSuccess(res, 201, 'GPS telemetry ingested successfully', gpsDoc);
}

export async function getLiveLocation(req: Request, res: Response): Promise<void> {
  const { vehicleId, routeId } = req.query;

  if (!vehicleId && !routeId) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Either vehicleId or routeId must be provided',
    );
  }

  // Student & Guardian Isolation (TEST-TRN-008)
  if (req.user && (req.user.role === 'STUDENT' || req.user.role === 'GUARDIAN')) {
    const validStudentIds: string[] = [];
    if (req.user.role === 'STUDENT') {
      validStudentIds.push(req.user.id);
      if (req.user.profileRef) validStudentIds.push(req.user.profileRef);
    } else if (req.user.role === 'GUARDIAN') {
      const guardianIds = [req.user.id];
      if (req.user.profileRef) guardianIds.push(req.user.profileRef);
      const links = await StudentGuardian.find({ guardianId: { $in: guardianIds } });
      validStudentIds.push(...links.map((link) => link.studentId.toString()));
    }

    const assignedVehicles = await StudentTransportAssignment.find({
      studentId: { $in: validStudentIds },
      status: 'ACTIVE',
    });

    const allowedVehicleIds = new Set(assignedVehicles.map((a) => a.vehicleId.toString()));
    const allowedRouteIds = new Set(assignedVehicles.map((a) => a.routeId.toString()));

    if (vehicleId && !allowedVehicleIds.has(vehicleId.toString())) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'You can only view live tracking for your assigned bus',
      );
    }

    if (routeId && !allowedRouteIds.has(routeId.toString())) {
      throw new AppError(
        403,
        ErrorCodes.RBAC_PERMISSION_DENIED,
        'You can only view live tracking for your assigned bus route',
      );
    }
  }

  const filter: Record<string, unknown> = {};
  if (vehicleId) filter.vehicleId = vehicleId;
  if (routeId) filter.routeId = routeId;

  const latestLocation = await GpsLocation.findOne(filter).sort({ timestamp: -1 });

  if (!latestLocation) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Live GPS telemetry not found');
  }

  sendSuccess(res, 200, 'Live location retrieved successfully', latestLocation);
}

export async function getTelemetryHistory(req: Request, res: Response): Promise<void> {
  const { vehicleId } = req.params;
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));

  const locations = await GpsLocation.find({ vehicleId })
    .sort({ timestamp: -1 })
    .limit(limit);

  sendSuccess(res, 200, 'Telemetry history retrieved successfully', locations);
}
