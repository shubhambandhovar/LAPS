import { Request, Response } from 'express';
import { ErrorCodes } from '@laps/shared';
import { StudentFeeLedger } from '../models/StudentFeeLedger';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listStudentFeeLedgers = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, classId, studentId, defaultersOnly, page = '1', limit = '20' } = req.query;

  const query: Record<string, unknown> = {};
  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (classId) query.classId = classId;
  if (studentId) query.studentId = studentId;

  if (defaultersOnly === 'true') {
    query.outstandingBalance = { $gt: 0 };
  }

  if (req.feeTeacherClassIds && req.feeTeacherClassIds.length > 0) {
    query.classId = { $in: req.feeTeacherClassIds };
    query.outstandingBalance = { $gt: 0 };
  }

  if (req.feeScopedStudentIds && req.feeScopedStudentIds.length > 0) {
    query.studentId = { $in: req.feeScopedStudentIds };
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.max(1, parseInt(limit as string, 10));
  const skip = (pageNum - 1) * limitNum;

  const [ledgers, total] = await Promise.all([
    StudentFeeLedger.find(query)
      .populate('studentId', 'admissionNumber firstName lastName')
      .populate('classId', 'name gradeLevel')
      .sort({ outstandingBalance: -1, lastUpdatedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    StudentFeeLedger.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  sendSuccess(res, 200, 'Student fee ledgers retrieved successfully', ledgers, {
    totalRecords: total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  });
};

export const getStudentFeeLedgerByEnrollment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { enrollmentId } = req.params;

  const ledger = await StudentFeeLedger.findOne({ enrollmentId })
    .populate('studentId', 'admissionNumber firstName lastName')
    .populate('classId', 'name gradeLevel')
    .populate('academicSessionId', 'name startDate endDate');

  if (!ledger) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Student fee ledger not found for this enrollment');
  }

  if (req.feeScopedStudentIds && !req.feeScopedStudentIds.includes(ledger.studentId._id.toString())) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'You are not authorized to view this student fee ledger'
    );
  }

  sendSuccess(res, 200, 'Student fee ledger retrieved successfully', ledger);
};

export const getMyStudentFeeLedger = async (req: Request, res: Response): Promise<void> => {
  const studentIds = req.feeScopedStudentIds || [];
  if (studentIds.length === 0) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'No linked student accounts found'
    );
  }

  const { academicSessionId } = req.query;
  const query: Record<string, unknown> = {
    studentId: { $in: studentIds },
  };

  if (academicSessionId) {
    query.academicSessionId = academicSessionId;
  }

  const ledgers = await StudentFeeLedger.find(query)
    .populate('studentId', 'admissionNumber firstName lastName')
    .populate('classId', 'name gradeLevel')
    .populate('academicSessionId', 'name startDate endDate')
    .sort({ lastUpdatedAt: -1 });

  sendSuccess(res, 200, 'My student fee ledgers retrieved successfully', ledgers);
};
