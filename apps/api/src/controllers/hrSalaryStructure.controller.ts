import { Request, Response } from 'express';
import { SalaryStructure } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes, salaryStructureSchema } from '@laps/shared';

export const getSalaryStructures = async (_req: Request, res: Response) => {
  try {
    const structures = await SalaryStructure.find().populate('employeeId').sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Success', structures);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch salary structures');
  }
};

export const getSalaryStructureByEmployee = async (req: Request, res: Response) => {
  try {
    const structure = await SalaryStructure.findOne({ employeeId: req.params.employeeId, isActive: true });
    if (!structure) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Salary structure not found');
    }
    return sendSuccess(res, 200, 'Success', structure);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch salary structure');
  }
};

export const createSalaryStructure = async (req: Request, res: Response) => {
  try {
    const parsed = salaryStructureSchema.parse(req.body);
    
    // Deactivate previous active structures for this employee
    await SalaryStructure.updateMany(
      { employeeId: parsed.employeeId, isActive: true },
      { $set: { isActive: false } }
    );

    const structure = await SalaryStructure.create({
      ...parsed,
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
    });
    return sendSuccess(res, 201, 'Salary structure created', structure);
  } catch (error: any) {
    if (error.errors) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors);
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to create salary structure');
  }
};
