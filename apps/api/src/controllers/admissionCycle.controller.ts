import { Request, Response } from 'express';
import { AdmissionCycle } from '../models/AdmissionCycle';
import { SeatAllocation } from '../models/SeatAllocation';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes } from '@laps/shared';
import { z } from 'zod';

const createCycleSchema = z.object({
  academicSessionId: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: z.enum(['OPEN', 'CLOSED', 'DRAFT']).default('DRAFT'),
});

const updateCycleSchema = createCycleSchema.partial();

export const createAdmissionCycle = async (req: Request, res: Response) => {
  try {
    const data = createCycleSchema.parse(req.body);
    
    // Ensure only one OPEN cycle exists at a time if this one is OPEN
    if (data.status === 'OPEN') {
      await AdmissionCycle.updateMany({ status: 'OPEN' }, { $set: { status: 'CLOSED' } });
    }

    const cycle = await AdmissionCycle.create(data);
    return sendSuccess(res, 201, 'Success', cycle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', (error.errors as any));
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to create admission cycle');
  }
};

export const getAdmissionCycles = async (_req: Request, res: Response) => {
  try {
    const cycles = await AdmissionCycle.find().populate('academicSessionId', 'name startDate endDate').sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Success', cycles);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch admission cycles');
  }
};

export const getActiveAdmissionCycle = async (_req: Request, res: Response) => {
  try {
    const cycle = await AdmissionCycle.findOne({ status: 'OPEN' }).populate('academicSessionId', 'name');
    if (!cycle) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'No active admission cycle found');
    }

    // Include seat matrix for the public view
    const seatAllocations = await SeatAllocation.find({ admissionCycleId: cycle._id }).populate('classId', 'name code level orderSequence');

    return sendSuccess(res, 200, 'Success', { cycle, seatAllocations });
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch active cycle');
  }
};

export const updateAdmissionCycle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateCycleSchema.parse(req.body);

    if (data.status === 'OPEN') {
      await AdmissionCycle.updateMany({ _id: { $ne: id }, status: 'OPEN' }, { $set: { status: 'CLOSED' } });
    }

    const cycle = await AdmissionCycle.findByIdAndUpdate(id, data, { new: true });
    if (!cycle) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Cycle not found');
    }
    return sendSuccess(res, 200, 'Success', cycle);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to update cycle');
  }
};
