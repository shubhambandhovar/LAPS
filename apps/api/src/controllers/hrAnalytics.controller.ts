import { Request, Response } from 'express';
import { Employee, Payroll } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes } from '@laps/shared';

export const getHrAnalytics = async (_req: Request, res: Response) => {
  try {
    const totalEmployees = await Employee.countDocuments({ status: 'ACTIVE' });
    const employeesByType = await Employee.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const employeesByDept = await Employee.aggregate([
      { $match: { status: 'ACTIVE' } },
      { $group: { _id: '$departmentId', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { department: '$dept.name', count: 1 } }
    ]);
    
    // Recent payroll cost
    const recentPayrolls = await Payroll.find({ status: 'PAID' })
      .sort({ year: -1, month: -1 })
      .limit(6);

    const summary = {
      headcount: totalEmployees,
      byType: employeesByType.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      byDepartment: employeesByDept,
      payrollCostTrend: recentPayrolls.reverse().map(p => ({
        label: `${p.month}/${p.year}`,
        cost: p.totalGross,
      }))
    };

    return sendSuccess(res, 200, 'Success', summary);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch HR analytics');
  }
};
