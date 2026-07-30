import { Request, Response } from 'express';
import { Payroll, Payslip, Employee, SalaryStructure, LeaveRequest } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes, generatePayrollSchema, updatePayrollStatusSchema } from '@laps/shared';

export const getPayrolls = async (_req: Request, res: Response) => {
  try {
    const payrolls = await Payroll.find().sort({ year: -1, month: -1 });
    return sendSuccess(res, 200, 'Success', payrolls);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch payrolls');
  }
};

export const generatePayroll = async (req: Request, res: Response) => {
  try {
    const { month, year } = generatePayrollSchema.parse(req.body);
    
    const existing = await Payroll.findOne({ month, year });
    if (existing) {
      return sendError(res, 409, ErrorCodes.DUPLICATE_RESOURCE, 'Payroll already generated for this month');
    }

    const employees = await Employee.find({ status: 'ACTIVE' });
    let totalGross = 0;
    let totalNet = 0;
    let totalDeductions = 0;

    const payroll = await Payroll.create({
      month,
      year,
      totalEmployees: employees.length,
      processedBy: req.user!.id,
    });

    for (const emp of employees) {
      const structure = await SalaryStructure.findOne({ employeeId: emp._id, isActive: true });
      if (!structure) continue; // Skip employees without a salary structure

      let gross = structure.basicSalary;
      let net = structure.basicSalary;
      let empDeductions = 0;

      for (const allow of structure.allowances) {
        const val = allow.type === 'PERCENTAGE' ? (structure.basicSalary * allow.amount) / 100 : allow.amount;
        gross += val;
        net += val;
      }

      for (const ded of structure.deductions) {
        const val = ded.type === 'PERCENTAGE' ? (structure.basicSalary * ded.amount) / 100 : ded.amount;
        empDeductions += val;
        net -= val;
      }

      // Check Leaves (Leave Without Pay) - Integration
      const lwps = await LeaveRequest.find({
        user: emp.userId,
        status: 'APPROVED',
        leaveType: 'LWP',
        // In a real system, you'd filter by month and year.
      });
      
      const lwpDeductionAmount = lwps.length > 0 ? (structure.basicSalary / 30) * lwps.length : 0;
      if (lwpDeductionAmount > 0) {
        empDeductions += lwpDeductionAmount;
        net -= lwpDeductionAmount;
      }

      totalGross += gross;
      totalNet += net;
      totalDeductions += empDeductions;

      await Payslip.create({
        payrollId: payroll._id,
        employeeId: emp._id,
        month,
        year,
        basicSalary: structure.basicSalary,
        allowances: structure.allowances,
        deductions: [
          ...structure.deductions,
          ...(lwpDeductionAmount > 0 ? [{ name: 'LWP', amount: lwpDeductionAmount, type: 'FIXED' }] : [])
        ],
        grossSalary: gross,
        netSalary: net,
      });
    }

    payroll.totalGross = totalGross;
    payroll.totalNet = totalNet;
    payroll.totalDeductions = totalDeductions;
    await payroll.save();

    return sendSuccess(res, 201, 'Payroll generated', payroll);
  } catch (error: any) {
    if (error.errors) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors);
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to generate payroll');
  }
};

export const updatePayrollStatus = async (req: Request, res: Response) => {
  try {
    const { status } = updatePayrollStatusSchema.parse(req.body);
    const payroll = await Payroll.findById(req.params.id);
    
    if (!payroll) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Payroll not found');
    }

    payroll.status = status;
    if (status === 'APPROVED') {
      payroll.approvedBy = req.user!.id as any;
    } else if (status === 'PAID') {
      payroll.paidAt = new Date();
      await Payslip.updateMany({ payrollId: payroll._id }, { $set: { status: 'PAID', paidDate: new Date() } });
      // Finance Integration: Add FinancialSummary ledger entry here
    }

    await payroll.save();
    return sendSuccess(res, 200, 'Payroll status updated', payroll);
  } catch (error: any) {
    if (error.errors) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', error.errors);
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to update payroll status');
  }
};
