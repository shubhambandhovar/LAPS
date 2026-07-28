import { Request, Response } from 'express';
import {
  CreateSectionSchema,
  UpdateSectionSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Section } from '../models/Section';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getSections(req: Request, res: Response): Promise<void> {
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
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.classId) {
    filter.classId = req.query.classId;
  }
  if (req.query.search) {
    filter.name = { $regex: String(req.query.search), $options: 'i' };
  }

  const sortBy = String(req.query.sortBy || 'name');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    Section.find(filter)
      .populate('classId', 'name code')
      .populate('academicSessionId', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Section.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Sections retrieved successfully', records, pagination);
}

export async function createSection(
  req: Request,
  res: Response,
): Promise<void> {
  const input = CreateSectionSchema.parse(req.body);

  const existing = await Section.findOne({
    academicSessionId: input.academicSessionId,
    classId: input.classId,
    name: input.name,
  });

  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Section "${input.name}" already exists for this class in the selected academic session`,
    );
  }

  const section = await Section.create({
    ...input,
    createdBy: req.user!.id,
    updatedBy: req.user!.id,
  });

  sendSuccess(res, 201, 'Section created successfully', section);
}

export async function getSectionById(
  req: Request,
  res: Response,
): Promise<void> {
  const section = await Section.findById(req.params.id)
    .populate('classId', 'name code')
    .populate('academicSessionId', 'name');

  if (!section) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Section not found');
  }

  sendSuccess(res, 200, 'Section retrieved successfully', section);
}

export async function updateSection(
  req: Request,
  res: Response,
): Promise<void> {
  const input = UpdateSectionSchema.parse(req.body);
  const section = await Section.findById(req.params.id);

  if (!section) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Section not found');
  }

  if (input.name && input.name !== section.name) {
    const existing = await Section.findOne({
      academicSessionId: section.academicSessionId,
      classId: section.classId,
      name: input.name,
      _id: { $ne: section._id },
    });
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Section "${input.name}" already exists for this class in the selected academic session`,
      );
    }
  }

  if (input.name) section.name = input.name;
  if (input.roomNumber !== undefined) section.roomNumber = input.roomNumber;
  if (input.maxCapacity !== undefined) section.maxCapacity = input.maxCapacity;
  if (input.status) section.status = input.status;
  section.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await section.save();

  sendSuccess(res, 200, 'Section updated successfully', section);
}

export async function archiveSection(
  req: Request,
  res: Response,
): Promise<void> {
  const section = await Section.findById(req.params.id);
  if (!section) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Section not found');
  }

  section.status = 'ARCHIVED';
  section.archivedBy = new mongoose.Types.ObjectId(req.user!.id);
  section.archivedAt = new Date();
  section.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await section.save();

  sendSuccess(res, 200, 'Section archived successfully', section);
}
