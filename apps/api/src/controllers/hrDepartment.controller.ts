import { Request, Response } from 'express';
import { Department } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes, departmentSchema } from '@laps/shared';

export const getDepartments = async (_req: Request, res: Response) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    return sendSuccess(res, 200, 'Success', departments);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch departments');
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const parsed = departmentSchema.parse(req.body);
    const existing = await Department.findOne({ code: parsed.code });
    if (existing) {
      return sendError(res, 409, ErrorCodes.DUPLICATE_RESOURCE, 'Department code already exists');
    }
    const department = await Department.create({
      ...parsed,
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
    });
    return sendSuccess(res, 201, 'Department created', department);
  } catch (error: any) {
    if (error.errors) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors);
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to create department');
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const parsed = departmentSchema.parse(req.body);
    const department = await Department.findById(req.params.id);
    if (!department) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Department not found');
    }
    if (parsed.code !== department.code) {
      const existing = await Department.findOne({ code: parsed.code });
      if (existing) {
        return sendError(res, 409, ErrorCodes.DUPLICATE_RESOURCE, 'Department code already exists');
      }
    }
    Object.assign(department, parsed);
    department.updatedBy = req.user!.id as any;
    await department.save();
    return sendSuccess(res, 200, 'Department updated', department);
  } catch (error: any) {
    if (error.errors) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors);
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to update department');
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Department not found');
    }
    department.isActive = false;
    department.updatedBy = req.user!.id as any;
    await department.save();
    return sendSuccess(res, 200, 'Department deleted', department);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to delete department');
  }
};
