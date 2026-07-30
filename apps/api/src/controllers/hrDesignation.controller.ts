import { Request, Response } from 'express';
import { Designation } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes, designationSchema } from '@laps/shared';

export const getDesignations = async (_req: Request, res: Response) => {
  try {
    const designations = await Designation.find().populate('departmentId', 'name code').sort({ level: 1, name: 1 });
    return sendSuccess(res, 200, 'Success', designations);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch designations');
  }
};

export const createDesignation = async (req: Request, res: Response) => {
  try {
    const parsed = designationSchema.parse(req.body);
    const designation = await Designation.create({
      ...parsed,
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
    });
    return sendSuccess(res, 201, 'Designation created', designation);
  } catch (error: any) {
    if (error.errors) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors);
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to create designation');
  }
};

export const updateDesignation = async (req: Request, res: Response) => {
  try {
    const parsed = designationSchema.parse(req.body);
    const designation = await Designation.findById(req.params.id);
    if (!designation) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Designation not found');
    }
    Object.assign(designation, parsed);
    designation.updatedBy = req.user!.id as any;
    await designation.save();
    return sendSuccess(res, 200, 'Designation updated', designation);
  } catch (error: any) {
    if (error.errors) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors);
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to update designation');
  }
};

export const deleteDesignation = async (req: Request, res: Response) => {
  try {
    const designation = await Designation.findById(req.params.id);
    if (!designation) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Designation not found');
    }
    designation.isActive = false;
    designation.updatedBy = req.user!.id as any;
    await designation.save();
    return sendSuccess(res, 200, 'Designation deleted', designation);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to delete designation');
  }
};
