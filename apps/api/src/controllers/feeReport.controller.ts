import { Request, Response } from 'express';
import { ErrorCodes } from '@laps/shared';
import { FinancialSummary } from '../models/FinancialSummary';
import { Payment } from '../models/Payment';
import { StudentFeeLedger } from '../models/StudentFeeLedger';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const getFinancialSummaryReport = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, classId } = req.query;

  if (!academicSessionId) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'academicSessionId is required for financial summary reports'
    );
  }

  const query: Record<string, unknown> = {
    academicSessionId,
    classId: classId || null,
  };

  let summary = await FinancialSummary.findOne(query)
    .populate('academicSessionId', 'name startDate endDate')
    .populate('classId', 'name gradeLevel');

  if (!summary) {
    // Return zeroed aggregate structure if no invoices or payments have been recorded yet
    summary = {
      academicSessionId: academicSessionId as any,
      classId: (classId as any) || null,
      totalInvoiced: 0,
      totalCollected: 0,
      totalWaived: 0,
      totalOutstanding: 0,
      defaultersCount: 0,
      collectionByMode: {
        cash: 0,
        upi: 0,
        card: 0,
        bankTransfer: 0,
        cheque: 0,
        onlineGateway: 0,
      },
      lastCalculatedAt: new Date(),
    } as any;
  }

  sendSuccess(res, 200, 'Materialized financial summary retrieved successfully', summary);
};

export const getDailyCollectionReport = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, date = new Date().toISOString().slice(0, 10), paymentMode } = req.query;

  const startOfDay = new Date(date as string);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date as string);
  endOfDay.setHours(23, 59, 59, 999);

  const query: Record<string, unknown> = {
    paymentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  };

  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (paymentMode && paymentMode !== 'ALL') query.paymentMode = paymentMode;

  const payments = await Payment.find(query)
    .populate('studentId', 'admissionNumber firstName lastName')
    .populate('recordedByUserId', 'firstName lastName')
    .sort({ paymentDate: -1 });

  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);

  sendSuccess(res, 200, 'Daily collection report retrieved successfully', {
    date,
    totalCollected,
    transactionCount: payments.length,
    transactions: payments,
  });
};

export const getMonthlyCollectionReport = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.query;

  const startOfMonth = new Date(Number(year), Number(month) - 1, 1, 0, 0, 0, 0);
  const endOfMonth = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);

  const query: Record<string, unknown> = {
    paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
    status: { $in: ['ACTIVE', 'COMPLETED'] },
  };
  if (academicSessionId) query.academicSessionId = academicSessionId;

  const payments = await Payment.find(query);

  const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const modeBreakdown: Record<string, number> = {
    CASH: 0,
    UPI: 0,
    CARD: 0,
    BANK_TRANSFER: 0,
    CHEQUE: 0,
    ONLINE_GATEWAY: 0,
  };

  for (const p of payments) {
    if (modeBreakdown[p.paymentMode] !== undefined) {
      modeBreakdown[p.paymentMode] += p.amountPaid;
    }
  }

  sendSuccess(res, 200, 'Monthly collection report retrieved successfully', {
    year: Number(year),
    month: Number(month),
    totalCollected,
    transactionCount: payments.length,
    collectionByMode: modeBreakdown,
  });
};

export const getClassWiseDuesReport = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId } = req.query;

  if (!academicSessionId) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'academicSessionId is required');
  }

  const summaries = await FinancialSummary.find({
    academicSessionId,
    classId: { $ne: null },
  })
    .populate('classId', 'name gradeLevel')
    .sort({ totalOutstanding: -1 });

  sendSuccess(res, 200, 'Class-wise dues report retrieved successfully', summaries);
};

export const getDefaultersReport = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, classId, minAmount = '1' } = req.query;

  const query: Record<string, unknown> = {
    outstandingBalance: { $gte: Number(minAmount) },
  };

  if (academicSessionId) query.academicSessionId = academicSessionId;

  if (req.feeTeacherClassIds && req.feeTeacherClassIds.length > 0) {
    query.classId = { $in: req.feeTeacherClassIds };
  } else if (classId) {
    query.classId = classId;
  }

  const defaulters = await StudentFeeLedger.find(query)
    .populate('studentId', 'admissionNumber firstName lastName phone email')
    .populate('classId', 'name gradeLevel')
    .sort({ outstandingBalance: -1 });

  sendSuccess(res, 200, 'Defaulters report retrieved successfully', defaulters);
};

export const getStudentFeeStatement = async (req: Request, res: Response): Promise<void> => {
  const { enrollmentId } = req.params;

  const ledger = await StudentFeeLedger.findOne({ enrollmentId })
    .populate('studentId', 'admissionNumber firstName lastName dateOfBirth gender')
    .populate('classId', 'name gradeLevel')
    .populate('academicSessionId', 'name startDate endDate');

  if (!ledger) {
    throw new AppError(
      404,
      ErrorCodes.RESOURCE_NOT_FOUND,
      'Fee statement not found for this enrollment'
    );
  }

  if (req.feeScopedStudentIds && !req.feeScopedStudentIds.includes(ledger.studentId._id.toString())) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'You are not authorized to view this student statement'
    );
  }

  sendSuccess(res, 200, 'Student fee statement retrieved successfully', ledger);
};
