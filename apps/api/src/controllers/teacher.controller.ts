import { Request, Response } from 'express';
import {
  CreateTeacherSchema,
  UpdateTeacherSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Teacher } from '../models/Teacher';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';
import { IdentityAutomationService } from '../services/identityAutomation.service';
import { logger } from '../config/logger';

export async function getTeachers(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '20'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  // RBAC isolation for TEACHER role: can only read their own profile
  if (req.user!.role === 'TEACHER') {
    filter.userId = req.user!.id;
  } else {
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.designation) {
      filter.designation = req.query.designation;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search), 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeId: searchRegex },
        { email: searchRegex },
      ];
    }
  }

  const sortBy = String(req.query.sortBy || 'lastName');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    Teacher.find(filter)
      .populate('userId', 'identifier email status')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Teacher.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Teachers retrieved successfully', records, pagination);
}

export async function createTeacher(
  req: Request,
  res: Response,
): Promise<void> {
  const input = CreateTeacherSchema.parse(req.body);

  const existingEmail = await Teacher.findOne({ email: input.email });
  if (existingEmail) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Teacher with email "${input.email}" already exists`,
    );
  }

  if (input.employeeId) {
    const existingEmp = await Teacher.findOne({
      employeeId: input.employeeId,
    });
    if (existingEmp) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Teacher with employee ID "${input.employeeId}" already exists`,
      );
    }
  }

  const teacher = await Teacher.create({
    ...input,
    joiningDate: new Date(input.joiningDate),
    createdBy: req.user!.id,
    updatedBy: req.user!.id,
  });

  try {
    await IdentityAutomationService.generateTeacherAccount(teacher._id);
  } catch (autoErr) {
    logger.error({ autoErr, teacherId: teacher._id }, 'Failed to auto-generate teacher account on creation');
  }

  const updatedTeacher = await Teacher.findById(teacher._id);

  sendSuccess(res, 201, 'Teacher created successfully', updatedTeacher || teacher);
}

export async function getTeacherById(
  req: Request,
  res: Response,
): Promise<void> {
  const teacher = await Teacher.findById(req.params.id).populate(
    'userId',
    'identifier email status',
  );
  if (!teacher) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Teacher not found');
  }

  // Enforce self-scope for TEACHER role
  const targetUserId =
    (teacher.userId as any)?._id?.toString() || teacher.userId?.toString();
  if (
    req.user!.role === 'TEACHER' &&
    targetUserId !== req.user!.id
  ) {
    throw new AppError(
      403,
      ErrorCodes.AUTH_SCOPE_FORBIDDEN,
      'Teacher is only authorized to access their own profile',
    );
  }

  sendSuccess(res, 200, 'Teacher retrieved successfully', teacher);
}

export async function updateTeacher(
  req: Request,
  res: Response,
): Promise<void> {
  const input = UpdateTeacherSchema.parse(req.body);
  const teacher = await Teacher.findById(req.params.id);

  if (!teacher) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Teacher not found');
  }

  if (input.email && input.email !== teacher.email) {
    const existing = await Teacher.findOne({
      email: input.email,
      _id: { $ne: teacher._id },
    });
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Teacher with email "${input.email}" already exists`,
      );
    }
  }

  if (input.employeeId && input.employeeId !== teacher.employeeId) {
    const existing = await Teacher.findOne({
      employeeId: input.employeeId,
      _id: { $ne: teacher._id },
    });
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Teacher with employee ID "${input.employeeId}" already exists`,
      );
    }
  }

  if (input.userId !== undefined) {
    teacher.userId = input.userId
      ? new mongoose.Types.ObjectId(input.userId)
      : undefined;
  }
  if (input.employeeId) teacher.employeeId = input.employeeId;
  if (input.firstName) teacher.firstName = input.firstName;
  if (input.lastName) teacher.lastName = input.lastName;
  if (input.email) teacher.email = input.email;
  if (input.phone) teacher.phone = input.phone;
  if (input.qualification) teacher.qualification = input.qualification;
  if (input.designation) teacher.designation = input.designation;
  if (input.joiningDate) teacher.joiningDate = new Date(input.joiningDate);
  if (input.isClassTeacher !== undefined) {
    teacher.isClassTeacher = input.isClassTeacher;
  }
  if (input.photoUrl !== undefined) teacher.photoUrl = input.photoUrl;
  if (input.status) teacher.status = input.status;
  teacher.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await teacher.save();

  sendSuccess(res, 200, 'Teacher updated successfully', teacher);
}

export async function archiveTeacher(
  req: Request,
  res: Response,
): Promise<void> {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Teacher not found');
  }

  teacher.status = 'ARCHIVED';
  teacher.archivedBy = new mongoose.Types.ObjectId(req.user!.id);
  teacher.archivedAt = new Date();
  teacher.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await teacher.save();

  sendSuccess(res, 200, 'Teacher archived successfully', teacher);
}
