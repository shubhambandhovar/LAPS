import { Request, Response } from 'express';
import { Employee } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes, employeeSchema } from '@laps/shared';

export const getEmployees = async (_req: Request, res: Response) => {
  try {
    const employees = await Employee.find()
      .populate('departmentId', 'name code')
      .populate('designationId', 'name level')
      .populate('userId', 'firstName lastName email identifier')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Success', employees);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch employees');
  }
};

export const getEmployeeById = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('designationId', 'name level')
      .populate('userId', 'firstName lastName email identifier');
    if (!employee) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Employee not found');
    }
    return sendSuccess(res, 200, 'Success', employee);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch employee');
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const parsed = employeeSchema.parse(req.body);
    
    // Auto generate employeeId if not provided (mock implementation)
    const count = await Employee.countDocuments();
    const employeeId = `EMP-${(count + 1001).toString()}`;

    const employee = await Employee.create({
      ...parsed,
      employeeId,
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
    });
    return sendSuccess(res, 201, 'Employee created', employee);
  } catch (error: any) {
    if (error.errors) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors);
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to create employee');
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const parsed = employeeSchema.parse(req.body);
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Employee not found');
    }
    Object.assign(employee, parsed);
    employee.updatedBy = req.user!.id as any;
    await employee.save();
    return sendSuccess(res, 200, 'Employee updated', employee);
  } catch (error: any) {
    if (error.errors) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors);
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to update employee');
  }
};
