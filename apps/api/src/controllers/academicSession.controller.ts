import { Request, Response } from 'express';
import {
  CreateAcademicSessionSchema,
  UpdateAcademicSessionSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { AcademicSession } from '../models/AcademicSession';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getAcademicSessions(
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
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.isCurrent !== undefined) {
    filter.isCurrent = req.query.isCurrent === 'true';
  }
  if (req.query.search) {
    filter.name = { $regex: String(req.query.search), $options: 'i' };
  }

  const sortBy = String(req.query.sortBy || 'startDate');
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

  const [records, totalRecords] = await Promise.all([
    AcademicSession.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    AcademicSession.countDocuments(filter).exec(),
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
    'Academic sessions retrieved successfully',
    records,
    pagination,
  );
}

export async function createAcademicSession(
  req: Request,
  res: Response,
): Promise<void> {
  const input = CreateAcademicSessionSchema.parse(req.body);

  const existing = await AcademicSession.findOne({ name: input.name });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Academic session with name "${input.name}" already exists`,
    );
  }

  const session = await AcademicSession.create({
    ...input,
    startDate: new Date(input.startDate),
    endDate: new Date(input.endDate),
    createdBy: req.user!.id,
    updatedBy: req.user!.id,
  });

  sendSuccess(res, 201, 'Academic session created successfully', session);
}

export async function getAcademicSessionById(
  req: Request,
  res: Response,
): Promise<void> {
  const session = await AcademicSession.findById(req.params.id);
  if (!session) {
    throw new AppError(
      404,
      ErrorCodes.VALIDATION_ERROR,
      'Academic session not found',
    );
  }

  sendSuccess(res, 200, 'Academic session retrieved successfully', session);
}

export async function updateAcademicSession(
  req: Request,
  res: Response,
): Promise<void> {
  const input = UpdateAcademicSessionSchema.parse(req.body);
  const session = await AcademicSession.findById(req.params.id);

  if (!session) {
    throw new AppError(
      404,
      ErrorCodes.VALIDATION_ERROR,
      'Academic session not found',
    );
  }

  if (input.name && input.name !== session.name) {
    const existing = await AcademicSession.findOne({
      name: input.name,
      _id: { $ne: session._id },
    });
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Academic session with name "${input.name}" already exists`,
      );
    }
  }

  if (input.name) session.name = input.name;
  if (input.startDate) session.startDate = new Date(input.startDate);
  if (input.endDate) session.endDate = new Date(input.endDate);
  if (input.status) session.status = input.status;
  if (input.isPromotionLocked !== undefined) {
    session.isPromotionLocked = input.isPromotionLocked;
  }
  session.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await session.save();

  sendSuccess(res, 200, 'Academic session updated successfully', session);
}

export async function activateAcademicSession(
  req: Request,
  res: Response,
): Promise<void> {
  const session = await AcademicSession.findById(req.params.id);
  if (!session) {
    throw new AppError(
      404,
      ErrorCodes.VALIDATION_ERROR,
      'Academic session not found',
    );
  }

  try {
    const dbSession = await mongoose.startSession();
    await dbSession.withTransaction(async () => {
      await AcademicSession.updateMany(
        { isCurrent: true, _id: { $ne: session._id } },
        { $set: { isCurrent: false } },
        { session: dbSession },
      );

      session.isCurrent = true;
      session.status = 'ACTIVE';
      session.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
      await session.save({ session: dbSession });
    });
    await dbSession.endSession();
  } catch {
    // Fallback for standalone MongoDB environments without replica set
    await AcademicSession.updateMany(
      { isCurrent: true, _id: { $ne: session._id } },
      { $set: { isCurrent: false } },
    );

    session.isCurrent = true;
    session.status = 'ACTIVE';
    session.updatedBy = new mongoose.Types.ObjectId(req.user!.id);
    await session.save();
  }

  sendSuccess(
    res,
    200,
    'Academic session activated successfully',
    session,
  );
}

export async function archiveAcademicSession(
  req: Request,
  res: Response,
): Promise<void> {
  const session = await AcademicSession.findById(req.params.id);
  if (!session) {
    throw new AppError(
      404,
      ErrorCodes.VALIDATION_ERROR,
      'Academic session not found',
    );
  }

  if (session.isCurrent) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Cannot archive the current active academic session',
    );
  }

  session.status = 'ARCHIVED';
  session.isCurrent = false;
  session.archivedBy = new mongoose.Types.ObjectId(req.user!.id);
  session.archivedAt = new Date();
  session.updatedBy = new mongoose.Types.ObjectId(req.user!.id);

  await session.save();

  sendSuccess(res, 200, 'Academic session archived successfully', session);
}
