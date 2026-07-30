import { Request, Response } from 'express';
import {
  CreateExamScheduleSchema,
  UpdateExamScheduleSchema,
  ErrorCodes,
} from '@laps/shared';
import { ExamSchedule } from '../models/ExamSchedule';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listExamSchedules = async (req: Request, res: Response): Promise<void> => {
  const { examId, academicSessionId, classId, sectionId, subjectId, status } = req.query;

  const query: Record<string, any> = {
    status: { $nin: ['CANCELLED', 'ARCHIVED'] },
  };

  if (examId) query.examId = examId;
  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (classId) query.classId = classId;
  if (sectionId) query.sectionId = sectionId;
  if (subjectId) query.subjectId = subjectId;
  if (status) query.status = status;

  const schedules = await ExamSchedule.find(query).sort({ date: 1, startTime: 1 });

  sendSuccess(res, 200, 'Exam schedules retrieved successfully', schedules);
};

export const getExamScheduleById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const schedule = await ExamSchedule.findById(id);

  if (!schedule || schedule.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Exam schedule not found');
  }

  sendSuccess(res, 200, 'Exam schedule retrieved successfully', schedule);
};

export const createExamSchedule = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateExamScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid schedule payload', parsed.error.errors);
  }

  const conflict = await ExamSchedule.checkConflicts({
    date: new Date(parsed.data.date),
    startTime: parsed.data.startTime,
    endTime: parsed.data.endTime,
    classId: parsed.data.classId,
    sectionId: parsed.data.sectionId,
    roomId: parsed.data.roomId,
    invigilatorId: parsed.data.invigilatorId,
  });

  if (conflict.hasConflict) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      conflict.message || `Exam schedule conflict detected (${conflict.conflictType})`
    );
  }

  const schedule = await ExamSchedule.create({
    ...parsed.data,
    status: parsed.data.status || 'SCHEDULED',
    createdBy: (req as any).user.id,
    updatedBy: (req as any).user.id,
  });

  sendSuccess(res, 201, 'Exam schedule created successfully', schedule);
};

export const updateExamSchedule = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = UpdateExamScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid update payload', parsed.error.errors);
  }

  const schedule = await ExamSchedule.findById(id);
  if (!schedule || schedule.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Exam schedule not found');
  }

  const checkDate = parsed.data.date ? new Date(parsed.data.date) : schedule.date;
  const checkStartTime = parsed.data.startTime || schedule.startTime;
  const checkEndTime = parsed.data.endTime || schedule.endTime;
  const checkClassId = parsed.data.classId || schedule.classId;
  const checkSectionId = parsed.data.sectionId !== undefined ? parsed.data.sectionId : schedule.sectionId;
  const checkRoomId = parsed.data.roomId !== undefined ? parsed.data.roomId : schedule.roomId;
  const checkInvigilatorId =
    parsed.data.invigilatorId !== undefined ? parsed.data.invigilatorId : schedule.invigilatorId;

  const conflict = await ExamSchedule.checkConflicts({
    examScheduleId: id,
    date: checkDate,
    startTime: checkStartTime,
    endTime: checkEndTime,
    classId: checkClassId,
    sectionId: checkSectionId,
    roomId: checkRoomId,
    invigilatorId: checkInvigilatorId,
  });

  if (conflict.hasConflict) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      conflict.message || `Exam schedule conflict detected (${conflict.conflictType})`
    );
  }

  Object.assign(schedule, parsed.data, {
    updatedBy: (req as any).user.id,
  });

  await schedule.save();
  sendSuccess(res, 200, 'Exam schedule updated successfully', schedule);
};

export const archiveExamSchedule = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const schedule = await ExamSchedule.findById(id);

  if (!schedule || schedule.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Exam schedule not found');
  }

  schedule.status = 'ARCHIVED';
  schedule.updatedBy = (req as any).user.id;

  await schedule.save();
  sendSuccess(res, 200, 'Exam schedule archived successfully', schedule);
};
