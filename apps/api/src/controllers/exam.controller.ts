import { Request, Response } from 'express';
import {
  CreateExamSchema,
  UpdateExamSchema,
  ErrorCodes,
} from '@laps/shared';
import { Exam } from '../models/Exam';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listExams = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, academicTermId, examType, status, page = '1', limit = '20' } = req.query;

  const query: Record<string, any> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (academicTermId) query.academicTermId = academicTermId;
  if (examType) query.examType = examType;
  if (status) query.status = status;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.max(1, parseInt(limit as string, 10));
  const skip = (pageNum - 1) * limitNum;

  const [exams, total] = await Promise.all([
    Exam.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Exam.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  sendSuccess(res, 200, 'Examinations retrieved successfully', exams, {
    totalRecords: total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  });
};

export const getExamById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const exam = await Exam.findById(id);

  if (!exam || exam.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Examination not found');
  }

  sendSuccess(res, 200, 'Examination retrieved successfully', exam);
};

export const createExam = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateExamSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid examination payload', parsed.error.errors);
  }

  const existing = await Exam.findOne({
    name: parsed.data.name,
    academicSessionId: parsed.data.academicSessionId,
    status: { $ne: 'ARCHIVED' },
  });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `An examination named "${parsed.data.name}" already exists in this academic session`
    );
  }

  const exam = await Exam.create({
    ...parsed.data,
    status: parsed.data.status || 'DRAFT',
    createdBy: (req as any).user.id,
    updatedBy: (req as any).user.id,
  });

  sendSuccess(res, 201, 'Examination created successfully', exam);
};

export const updateExam = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = UpdateExamSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid update payload', parsed.error.errors);
  }

  const exam = await Exam.findById(id);
  if (!exam || exam.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Examination not found');
  }

  Object.assign(exam, parsed.data, {
    updatedBy: (req as any).user.id,
  });

  await exam.save();
  sendSuccess(res, 200, 'Examination updated successfully', exam);
};

export const publishExam = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const exam = await Exam.findById(id);

  if (!exam || exam.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Examination not found');
  }

  exam.status = 'PUBLISHED';
  exam.publishedAt = new Date();
  exam.publishedBy = (req as any).user.id;
  exam.updatedBy = (req as any).user.id;

  await exam.save();
  sendSuccess(res, 200, 'Examination published successfully', exam);
};

export const lockExam = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const exam = await Exam.findById(id);

  if (!exam || exam.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Examination not found');
  }

  exam.status = 'COMPLETED';
  exam.updatedBy = (req as any).user.id;

  await exam.save();
  sendSuccess(res, 200, 'Examination locked successfully', exam);
};

export const archiveExam = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const exam = await Exam.findById(id);

  if (!exam || exam.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Examination not found');
  }

  exam.status = 'ARCHIVED';
  exam.archivedAt = new Date();
  exam.archivedBy = (req as any).user.userId;
  exam.updatedBy = (req as any).user.userId;

  await exam.save();
  sendSuccess(res, 200, 'Examination archived successfully', exam);
};
