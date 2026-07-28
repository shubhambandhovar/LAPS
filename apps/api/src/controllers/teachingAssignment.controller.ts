import { Request, Response } from 'express';
import {
  CreateTeachingAssignmentSchema,
  UpdateTeachingAssignmentSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Teacher } from '../models/Teacher';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getTeachingAssignments(
  req: Request,
  res: Response,
): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '20'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  // RBAC isolation for TEACHER role: can only read their own teaching assignments
  if (req.user!.role === 'TEACHER') {
    const teacherProfile = await Teacher.findOne({ userId: req.user!.id });
    if (!teacherProfile) {
      sendSuccess(
        res,
        200,
        'Teaching assignments retrieved successfully',
        [],
        {
          page,
          limit,
          totalRecords: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      );
      return;
    }
    filter.teacherId = teacherProfile._id;
  } else {
    if (req.query.teacherId) {
      filter.teacherId = req.query.teacherId;
    }
  }

  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.classId) {
    filter.classId = req.query.classId;
  }
  if (req.query.sectionId) {
    filter.sectionId = req.query.sectionId;
  }
  if (req.query.subjectId) {
    filter.subjectId = req.query.subjectId;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const sortBy = String(req.query.sortBy || 'effectiveFrom');
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const [records, totalRecords] = await Promise.all([
    TeachingAssignment.find(filter)
      .populate('teacherId', 'employeeId firstName lastName email designation')
      .populate('academicSessionId', 'name isCurrent')
      .populate('classId', 'name code level')
      .populate('sectionId', 'name roomNumber')
      .populate('subjectId', 'name code shortName subjectType')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    TeachingAssignment.countDocuments(filter).exec(),
  ]);

  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const pagination: PaginationMeta = {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  sendSuccess(
    res,
    200,
    'Teaching assignments retrieved successfully',
    records,
    pagination,
  );
}

export async function createTeachingAssignment(
  req: Request,
  res: Response,
): Promise<void> {
  const input = CreateTeachingAssignmentSchema.parse(req.body);

  const existingDuplicate = await TeachingAssignment.findOne({
    academicSessionId: input.academicSessionId,
    teacherId: input.teacherId,
    classId: input.classId,
    sectionId: input.sectionId,
    subjectId: input.subjectId,
  });

  if (existingDuplicate) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      'This teacher is already assigned to this subject and section for the selected academic session',
    );
  }

  try {
    const assignment = await TeachingAssignment.create({
      ...input,
      effectiveFrom: new Date(input.effectiveFrom),
      effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : undefined,
      createdBy: req.user!.id,
      updatedBy: req.user!.id,
    });

    const populated = await TeachingAssignment.findById(assignment._id)
      .populate('teacherId', 'employeeId firstName lastName email designation')
      .populate('academicSessionId', 'name isCurrent')
      .populate('classId', 'name code level')
      .populate('sectionId', 'name roomNumber')
      .populate('subjectId', 'name code shortName subjectType');

    sendSuccess(
      res,
      201,
      'Teaching assignment created successfully',
      populated,
    );
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('overlapping effective dates')) {
      throw new AppError(409, ErrorCodes.VALIDATION_ERROR, err.message);
    }
    throw err;
  }
}

export async function getTeachingAssignmentById(
  req: Request,
  res: Response,
): Promise<void> {
  const assignment = await TeachingAssignment.findById(req.params.id)
    .populate('teacherId', 'employeeId firstName lastName email designation')
    .populate('academicSessionId', 'name isCurrent')
    .populate('classId', 'name code level')
    .populate('sectionId', 'name roomNumber')
    .populate('subjectId', 'name code shortName subjectType');

  if (!assignment) {
    throw new AppError(
      404,
      ErrorCodes.VALIDATION_ERROR,
      'Teaching assignment not found',
    );
  }

  // Enforce self-scope for TEACHER role
  if (req.user!.role === 'TEACHER') {
    const teacherProfile = await Teacher.findOne({ userId: req.user!.id });
    if (
      !teacherProfile ||
      assignment.teacherId._id.toString() !== teacherProfile._id.toString()
    ) {
      throw new AppError(
        403,
        ErrorCodes.AUTH_SCOPE_FORBIDDEN,
        'Teacher is only authorized to access their own teaching assignments',
      );
    }
  }

  sendSuccess(
    res,
    200,
    'Teaching assignment retrieved successfully',
    assignment,
  );
}

export async function updateTeachingAssignment(
  req: Request,
  res: Response,
): Promise<void> {
  const input = UpdateTeachingAssignmentSchema.parse(req.body);
  const assignment = await TeachingAssignment.findById(req.params.id);

  if (!assignment) {
    throw new AppError(
      404,
      ErrorCodes.VALIDATION_ERROR,
      'Teaching assignment not found',
    );
  }

  if (input.isClassTeacher !== undefined) {
    assignment.isClassTeacher = input.isClassTeacher;
  }
  if (input.effectiveFrom) {
    assignment.effectiveFrom = new Date(input.effectiveFrom);
  }
  if (input.effectiveTo !== undefined) {
    assignment.effectiveTo = input.effectiveTo
      ? new Date(input.effectiveTo)
      : undefined;
  }
  if (input.status) {
    assignment.status = input.status;
  }
  assignment.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  try {
    await assignment.save();
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('overlapping effective dates')) {
      throw new AppError(409, ErrorCodes.VALIDATION_ERROR, err.message);
    }
    throw err;
  }

  const populated = await TeachingAssignment.findById(assignment._id)
    .populate('teacherId', 'employeeId firstName lastName email designation')
    .populate('academicSessionId', 'name isCurrent')
    .populate('classId', 'name code level')
    .populate('sectionId', 'name roomNumber')
    .populate('subjectId', 'name code shortName subjectType');

  sendSuccess(
    res,
    200,
    'Teaching assignment updated successfully',
    populated,
  );
}

export async function archiveTeachingAssignment(
  req: Request,
  res: Response,
): Promise<void> {
  const assignment = await TeachingAssignment.findById(req.params.id);
  if (!assignment) {
    throw new AppError(
      404,
      ErrorCodes.VALIDATION_ERROR,
      'Teaching assignment not found',
    );
  }

  assignment.status = 'ARCHIVED';
  assignment.archivedBy = new mongoose.Types.ObjectId(req.user!.id);
  assignment.archivedAt = new Date();
  assignment.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await assignment.save();

  sendSuccess(
    res,
    200,
    'Teaching assignment archived successfully',
    assignment,
  );
}
