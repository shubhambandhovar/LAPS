import { Request, Response } from 'express';
import {
  CreateReEvaluationRequestSchema,
  ReviewReEvaluationSchema,
  CompleteReEvaluationSchema,
  ErrorCodes,
  ReEvaluationAuditTrailItem,
} from '@laps/shared';
import { ReEvaluationRequest } from '../models/ReEvaluationRequest';
import { MarksEntry } from '../models/MarksEntry';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listReEvaluations = async (req: Request, res: Response): Promise<void> => {
  const { examId, enrollmentId, studentId, status } = req.query;

  const query: Record<string, any> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (examId) query.examId = examId;
  if (enrollmentId) query.enrollmentId = enrollmentId;
  if (studentId) query.studentId = studentId;
  if (status) query.status = status;

  const list = await ReEvaluationRequest.find(query).sort({ createdAt: -1 });

  sendSuccess(res, 200, 'Re-evaluations retrieved successfully', list);
};

export const getReEvaluationById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const item = await ReEvaluationRequest.findById(id);

  if (!item || item.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Re-evaluation request not found');
  }

  sendSuccess(res, 200, 'Re-evaluation request retrieved successfully', item);
};

export const createReEvaluationRequest = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateReEvaluationRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid re-evaluation request payload', parsed.error.errors);
  }

  const marksEntry = await MarksEntry.findById(parsed.data.marksEntryId);
  if (!marksEntry || marksEntry.status !== 'PUBLISHED') {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Re-evaluation can only be requested for published marks entries'
    );
  }

  const existing = await ReEvaluationRequest.findOne({
    marksEntryId: parsed.data.marksEntryId,
    requestType: parsed.data.requestType,
    status: { $nin: ['REJECTED', 'ARCHIVED'] },
  });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      'A re-evaluation request of this type has already been submitted for these marks'
    );
  }

  const userId = (req as any).user.id;
  const now = new Date();
  const auditItem: ReEvaluationAuditTrailItem = {
    action: 'SUBMITTED',
    timestamp: now,
    userId,
    previousMarks: marksEntry.totalMarksObtained,
    comment: `Request submitted: ${parsed.data.reason}`,
  };

  const requestDoc = await ReEvaluationRequest.create({
    ...parsed.data,
    previousMarks: marksEntry.totalMarksObtained,
    previousGrade: marksEntry.grade,
    status: 'SUBMITTED',
    auditTrail: [auditItem],
    createdBy: userId,
    updatedBy: userId,
  });

  sendSuccess(res, 201, 'Re-evaluation request submitted successfully', requestDoc);
};

export const reviewReEvaluation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = ReviewReEvaluationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid review payload', parsed.error.errors);
  }

  const item = await ReEvaluationRequest.findById(id);
  if (!item || item.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Re-evaluation request not found');
  }

  const userId = (req as any).user.id;
  const now = new Date();

  item.status = parsed.data.status;
  item.reviewedBy = userId;
  item.reviewedAt = now;
  if (parsed.data.evaluatorTeacherId) item.evaluatorTeacherId = parsed.data.evaluatorTeacherId as any;

  item.auditTrail.push({
    action: parsed.data.status,
    timestamp: now,
    userId,
    comment: parsed.data.reviewRemarks || `Request reviewed by administrator -> ${parsed.data.status}`,
  });

  item.updatedBy = userId;
  await item.save();

  sendSuccess(res, 200, 'Re-evaluation request reviewed successfully', item);
};

export const completeReEvaluation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = CompleteReEvaluationSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid completion payload', parsed.error.errors);
  }

  const item = await ReEvaluationRequest.findById(id);
  if (!item || item.status !== 'APPROVED_FOR_EVALUATION') {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Re-evaluation request must be APPROVED_FOR_EVALUATION before completing evaluation'
    );
  }

  const marksEntry = await MarksEntry.findById(item.marksEntryId);
  if (!marksEntry) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Associated marks entry not found');
  }

  const userId = (req as any).user.id;
  const now = new Date();
  const prevTotal = marksEntry.totalMarksObtained;

  item.revisedMarks = parsed.data.revisedMarks;
  item.revisedGrade = parsed.data.revisedGrade;
  item.marksChanged = parsed.data.revisedMarks !== prevTotal;
  item.evaluationRemarks = parsed.data.evaluationRemarks;
  item.status = 'COMPLETED';
  item.completedAt = now;
  item.updatedBy = userId;

  item.auditTrail.push({
    action: 'COMPLETED',
    timestamp: now,
    userId,
    previousMarks: prevTotal,
    newMarks: parsed.data.revisedMarks,
    comment: parsed.data.evaluationRemarks,
  });

  await item.save();

  if (item.marksChanged) {
    marksEntry.totalMarksObtained = parsed.data.revisedMarks;
    marksEntry.grade = parsed.data.revisedGrade;
    marksEntry.history.push({
      modifiedBy: userId,
      modifiedAt: now,
      previousTotal: prevTotal,
      newTotal: parsed.data.revisedMarks,
      reason: `Re-evaluation revision (${item.requestType}): ${parsed.data.evaluationRemarks}`,
      status: marksEntry.status,
    });
    await marksEntry.save();
  }

  sendSuccess(res, 200, 'Re-evaluation completed successfully', item);
};

export const archiveReEvaluation = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const item = await ReEvaluationRequest.findById(id);

  if (!item || item.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Re-evaluation request not found');
  }

  item.status = 'ARCHIVED';
  item.updatedBy = (req as any).user.id;

  await item.save();
  sendSuccess(res, 200, 'Re-evaluation archived successfully', item);
};
