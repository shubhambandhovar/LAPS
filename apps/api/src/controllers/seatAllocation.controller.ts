import { Request, Response } from 'express';
import { SeatAllocation } from '../models/SeatAllocation';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes } from '@laps/shared';
import { z } from 'zod';

const updateSeatAllocationSchema = z.object({
  totalSeats: z.number().int().nonnegative().optional(),
  reservedSeats: z.number().int().nonnegative().optional(),
});

export const getSeatAllocations = async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.query;
    const query: any = {};
    if (cycleId) query.admissionCycleId = cycleId;

    const allocations = await SeatAllocation.find(query)
      .populate('classId', 'name code level orderSequence')
      .populate('admissionCycleId', 'name status');
      
    return sendSuccess(res, 200, 'Success', allocations);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch seat allocations');
  }
};

export const updateSeatAllocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateSeatAllocationSchema.parse(req.body);

    const allocation = await SeatAllocation.findById(id);
    if (!allocation) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Seat allocation not found');
    }

    if (data.totalSeats !== undefined) {
      // Adjust available seats based on the new total seats difference
      const difference = data.totalSeats - allocation.totalSeats;
      allocation.totalSeats = data.totalSeats;
      allocation.availableSeats += difference;
    }

    if (data.reservedSeats !== undefined) {
      allocation.reservedSeats = data.reservedSeats;
    }

    await allocation.save();
    return sendSuccess(res, 200, 'Success', allocation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', (error.errors as any));
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to update seat allocation');
  }
};

// Internal utility to initialize seat allocation for a new class/cycle
export const initializeSeatAllocation = async (req: Request, res: Response) => {
  try {
    const { admissionCycleId, classId, totalSeats, reservedSeats } = req.body;
    const allocation = await SeatAllocation.create({
      admissionCycleId,
      classId,
      totalSeats,
      availableSeats: totalSeats,
      reservedSeats: reservedSeats || 0,
      waitlistCount: 0,
    });
    return sendSuccess(res, 201, 'Success', allocation);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to initialize seat allocation');
  }
};
