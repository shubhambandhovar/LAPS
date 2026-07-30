import { Request, Response } from 'express';
import { Payslip } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes } from '@laps/shared';

export const getPayslips = async (req: Request, res: Response) => {
  try {
    const { payrollId, employeeId } = req.query;
    const filter: any = {};
    if (payrollId) filter.payrollId = payrollId;
    if (employeeId) filter.employeeId = employeeId;

    const payslips = await Payslip.find(filter)
      .populate('employeeId')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Success', payslips);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch payslips');
  }
};

export const getMyPayslips = async (req: Request, res: Response) => {
  try {
    const payslips = await Payslip.find()
      .populate({
        path: 'employeeId',
        match: { userId: req.user!.id }
      })
      .sort({ createdAt: -1 });
    
    // Filter out null employeeIds in case the user doesn't map exactly
    const filtered = payslips.filter(p => p.employeeId !== null);
    
    return sendSuccess(res, 200, 'Success', filtered);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch your payslips');
  }
};
