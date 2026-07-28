import { Request, Response } from 'express';
import {
  CreateClassSchema,
  UpdateClassSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Class } from '../models/Class';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getClasses(req: Request, res: Response): Promise<void> {
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
  if (req.query.level) {
    filter.level = req.query.level;
  }
  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search), 'i');
    filter.$or = [{ name: searchRegex }, { code: searchRegex }];
  }

  const sortBy = String(req.query.sortBy || 'orderSequence');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    Class.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Class.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Classes retrieved successfully', records, pagination);
}

export async function createClass(req: Request, res: Response): Promise<void> {
  const input = CreateClassSchema.parse(req.body);

  const existingName = await Class.findOne({ name: input.name });
  if (existingName) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Class with name "${input.name}" already exists`,
    );
  }

  if (input.code) {
    const existingCode = await Class.findOne({ code: input.code });
    if (existingCode) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Class with code "${input.code}" already exists`,
      );
    }
  }

  const cls = await Class.create({
    ...input,
    createdBy: req.user!.id,
    updatedBy: req.user!.id,
  });

  sendSuccess(res, 201, 'Class created successfully', cls);
}

export async function getClassById(req: Request, res: Response): Promise<void> {
  const cls = await Class.findById(req.params.id);
  if (!cls) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Class not found');
  }

  sendSuccess(res, 200, 'Class retrieved successfully', cls);
}

export async function updateClass(req: Request, res: Response): Promise<void> {
  const input = UpdateClassSchema.parse(req.body);
  const cls = await Class.findById(req.params.id);

  if (!cls) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Class not found');
  }

  if (input.name && input.name !== cls.name) {
    const existing = await Class.findOne({
      name: input.name,
      _id: { $ne: cls._id },
    });
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Class with name "${input.name}" already exists`,
      );
    }
  }

  if (input.code && input.code !== cls.code) {
    const existing = await Class.findOne({
      code: input.code,
      _id: { $ne: cls._id },
    });
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Class with code "${input.code}" already exists`,
      );
    }
  }

  if (input.name) cls.name = input.name;
  if (input.code) cls.code = input.code;
  if (input.level) cls.level = input.level;
  if (input.orderSequence !== undefined) {
    cls.orderSequence = input.orderSequence;
  }
  if (input.status) cls.status = input.status;
  cls.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await cls.save();

  sendSuccess(res, 200, 'Class updated successfully', cls);
}

export async function archiveClass(req: Request, res: Response): Promise<void> {
  const cls = await Class.findById(req.params.id);
  if (!cls) {
    throw new AppError(404, ErrorCodes.VALIDATION_ERROR, 'Class not found');
  }

  cls.status = 'ARCHIVED';
  cls.archivedBy = new mongoose.Types.ObjectId(req.user!.id);
  cls.archivedAt = new Date();
  cls.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await cls.save();

  sendSuccess(res, 200, 'Class archived successfully', cls);
}
