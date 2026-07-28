import { Request, Response } from 'express';
import {
  CreateSubjectSchema,
  UpdateSubjectSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Subject } from '../models/Subject';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getSubjects(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '20'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.subjectType) {
    filter.subjectType = req.query.subjectType;
  }
  if (req.query.isOptional !== undefined) {
    filter.isOptional = req.query.isOptional === 'true';
  }
  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search), 'i');
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { shortName: searchRegex },
    ];
  }

  const sortBy = String(req.query.sortBy || 'name');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    Subject.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Subject.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Subjects retrieved successfully', records, pagination);
}

export async function createSubject(
  req: Request,
  res: Response,
): Promise<void> {
  const input = CreateSubjectSchema.parse(req.body);

  const existingName = await Subject.findOne({ name: input.name });
  if (existingName) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Subject with name "${input.name}" already exists`,
    );
  }

  if (input.code) {
    const existingCode = await Subject.findOne({ code: input.code });
    if (existingCode) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Subject with code "${input.code}" already exists`,
      );
    }
  }

  const subject = await Subject.create({
    ...input,
    createdBy: req.user!.id,
    updatedBy: req.user!.id,
  });

  sendSuccess(res, 201, 'Subject created successfully', subject);
}

export async function getSubjectById(
  req: Request,
  res: Response,
): Promise<void> {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Subject not found');
  }

  sendSuccess(res, 200, 'Subject retrieved successfully', subject);
}

export async function updateSubject(
  req: Request,
  res: Response,
): Promise<void> {
  const input = UpdateSubjectSchema.parse(req.body);
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Subject not found');
  }

  if (input.name && input.name !== subject.name) {
    const existing = await Subject.findOne({
      name: input.name,
      _id: { $ne: subject._id },
    });
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Subject with name "${input.name}" already exists`,
      );
    }
  }

  if (input.code && input.code !== subject.code) {
    const existing = await Subject.findOne({
      code: input.code,
      _id: { $ne: subject._id },
    });
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Subject with code "${input.code}" already exists`,
      );
    }
  }

  if (input.name) subject.name = input.name;
  if (input.code) subject.code = input.code;
  if (input.shortName) subject.shortName = input.shortName;
  if (input.subjectType) subject.subjectType = input.subjectType;
  if (input.isOptional !== undefined) subject.isOptional = input.isOptional;
  if (input.status) subject.status = input.status;
  subject.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await subject.save();

  sendSuccess(res, 200, 'Subject updated successfully', subject);
}

export async function archiveSubject(
  req: Request,
  res: Response,
): Promise<void> {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Subject not found');
  }

  subject.status = 'ARCHIVED';
  subject.archivedBy = new mongoose.Types.ObjectId(req.user!.id);
  subject.archivedAt = new Date();
  subject.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await subject.save();

  sendSuccess(res, 200, 'Subject archived successfully', subject);
}
