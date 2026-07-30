import { Request, Response } from 'express';
import { ErrorCodes } from '@laps/shared';
import { TransportSummary } from '../models/TransportSummary';
import { Vehicle } from '../models/Vehicle';
import { Driver } from '../models/Driver';
import { Route } from '../models/Route';
import { Stop } from '../models/Stop';
import { StudentTransportAssignment } from '../models/StudentTransportAssignment';
import { MaintenanceRecord } from '../models/MaintenanceRecord';
import { AcademicSession } from '../models/AcademicSession';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export async function calculateSummaryForSession(
  schoolId: string,
  academicSessionId: string,
) {
  const [
    totalVehicles,
    activeVehicles,
    inMaintenanceVehicles,
    totalDrivers,
    totalRoutes,
    totalStops,
    totalAssignedStudents,
    vehicles,
    maintenanceRecords,
  ] = await Promise.all([
    Vehicle.countDocuments({ schoolId, status: { $ne: 'RETIRED' } }),
    Vehicle.countDocuments({ schoolId, status: 'ACTIVE' }),
    Vehicle.countDocuments({ schoolId, status: 'MAINTENANCE' }),
    Driver.countDocuments({ schoolId, status: 'ACTIVE' }),
    Route.countDocuments({ schoolId, status: 'ACTIVE' }),
    Stop.countDocuments({ schoolId, status: 'ACTIVE' }),
    StudentTransportAssignment.countDocuments({ schoolId, academicSessionId, status: 'ACTIVE' }),
    Vehicle.find({ schoolId, status: { $ne: 'RETIRED' } }),
    MaintenanceRecord.find({ schoolId, status: 'COMPLETED' }),
  ]);

  const totalFleetCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);
  const overallOccupancyPercentage =
    totalFleetCapacity > 0 ? Math.round((totalAssignedStudents / totalFleetCapacity) * 100) : 0;

  const totalSpendYearToDate = maintenanceRecords.reduce((sum, m) => sum + m.costAmount, 0);

  const vehicleUtilization = await Promise.all(
    vehicles.map(async (v) => {
      const activeAssignments = await StudentTransportAssignment.countDocuments({
        vehicleId: v._id,
        academicSessionId,
        status: 'ACTIVE',
      });
      const occupancyPercentage = v.capacity > 0 ? Math.round((activeAssignments / v.capacity) * 100) : 0;
      return {
        vehicleId: v._id,
        registrationNumber: v.registrationNumber,
        capacity: v.capacity,
        activeAssignments,
        occupancyPercentage,
        status: v.status,
      };
    }),
  );

  const routes = await Route.find({ schoolId, status: 'ACTIVE' });
  const routeUtilization = await Promise.all(
    routes.map(async (r) => {
      const totalStudents = await StudentTransportAssignment.countDocuments({
        routeId: r._id,
        academicSessionId,
        status: 'ACTIVE',
      });
      return {
        routeId: r._id,
        routeName: r.routeName,
        totalStops: r.stops.length,
        totalStudents,
      };
    }),
  );

  const summary = await TransportSummary.findOneAndUpdate(
    { schoolId, academicSessionId },
    {
      $set: {
        totalVehicles,
        activeVehicles,
        inMaintenanceVehicles,
        totalDrivers,
        totalRoutes,
        totalStops,
        totalAssignedStudents,
        totalFleetCapacity,
        overallOccupancyPercentage,
        vehicleUtilization,
        routeUtilization,
        maintenanceSummary: {
          totalSpendYearToDate,
          pendingRenewalsCount: 0,
          vehiclesDueForServiceCount: 0,
        },
        lastCalculatedAt: new Date(),
      },
    },
    { new: true, upsert: true },
  );

  return summary;
}

export async function getTransportSummary(req: Request, res: Response): Promise<void> {
  const schoolId = (req.query.schoolId as string) || 'LAPS-GOHAD';
  let academicSessionId = req.query.academicSessionId as string;

  if (!academicSessionId) {
    const activeSession = await AcademicSession.findOne({ schoolId, isCurrent: true });
    if (!activeSession) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Academic session ID is required or no active session found',
      );
    }
    academicSessionId = activeSession._id.toString();
  }

  const summary = await calculateSummaryForSession(schoolId, academicSessionId);
  sendSuccess(res, 200, 'Transport summary retrieved successfully', summary);
}

export async function recalculateTransportSummary(req: Request, res: Response): Promise<void> {
  const schoolId = (req.query.schoolId as string) || 'LAPS-GOHAD';
  let academicSessionId = (req.body.academicSessionId as string) || (req.query.academicSessionId as string);

  if (!academicSessionId) {
    const activeSession = await AcademicSession.findOne({ schoolId, isCurrent: true });
    if (!activeSession) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        'Academic session ID is required or no active session found',
      );
    }
    academicSessionId = activeSession._id.toString();
  }

  const summary = await calculateSummaryForSession(schoolId, academicSessionId);
  sendSuccess(res, 200, 'Transport summary recalculated successfully', summary);
}
