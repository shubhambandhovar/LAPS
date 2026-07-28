import { Request, Response } from 'express';
import {
  CreateGuardianSchema,
  UpdateGuardianSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Guardian } from '../models/Guardian';
import { StudentGuardian } from '../models/StudentGuardian';
import { Enrollment } from '../models/Enrollment';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getGuardians(
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
  if (req.query.relationship) {
    filter.relationship = req.query.relationship;
  }

  if (req.query.search && String(req.query.search).trim() !== '') {
    const searchTerm = String(req.query.search).trim();
    const regex = new RegExp(searchTerm, 'i');
    filter.$or = [
      { name: regex },
      { phone: regex },
      { email: regex },
    ];
  }

  const sortBy = String(req.query.sortBy || 'name');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    Guardian.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Guardian.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Guardians retrieved successfully', records, pagination);
}

export async function getGuardianById(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Guardian ID.');
  }

  const guardian = await Guardian.findById(id).exec();
  if (!guardian) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Guardian not found.');
  }

  const studentGuardians = await StudentGuardian.find({ guardianId: id })
    .populate('studentId')
    .exec();

  const linkedStudents = studentGuardians.map((sg) => {
    const sgObj = sg.toJSON();
    const studentObj = sg.studentId ? (sg.studentId as unknown as Record<string, unknown>) : undefined;
    return {
      id: sgObj.id,
      studentId: sgObj.studentId,
      guardianId: sgObj.guardianId,
      relationship: sgObj.relationship,
      isPrimaryGuardian: sgObj.isPrimaryGuardian,
      pickupPermission: sgObj.pickupPermission,
      emergencyContactPermission: sgObj.emergencyContactPermission,
      student: studentObj,
    };
  });

  sendSuccess(res, 200, 'Guardian retrieved successfully', {
    guardian: guardian.toJSON(),
    linkedStudents,
  });
}

export async function createGuardian(
  req: Request,
  res: Response,
): Promise<void> {
  const result = CreateGuardianSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const guardian = await Guardian.create({
    ...result.data,
    createdBy: userId,
    updatedBy: userId,
  });

  sendSuccess(res, 201, 'Guardian created successfully', guardian.toJSON());
}

export async function updateGuardian(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Guardian ID.');
  }

  const result = UpdateGuardianSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const updatedGuardian = await Guardian.findByIdAndUpdate(
    id,
    {
      $set: {
        ...result.data,
        updatedBy: userId,
      },
    },
    { new: true, runValidators: true },
  ).exec();

  if (!updatedGuardian) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Guardian not found.');
  }

  sendSuccess(res, 200, 'Guardian updated successfully', updatedGuardian.toJSON());
}

export async function archiveGuardian(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Guardian ID.');
  }

  const relationships = await StudentGuardian.find({ guardianId: id }).exec();

  for (const rel of relationships) {
    const count = await StudentGuardian.countDocuments({
      studentId: rel.studentId,
    }).exec();

    if (count <= 1) {
      const activeEnrollment = await Enrollment.findOne({
        studentId: rel.studentId,
        enrollmentStatus: 'ACTIVE',
      }).exec();

      if (activeEnrollment) {
        throw new AppError(
          409,
          ErrorCodes.BUSINESS_RULE_VIOLATION,
          'Cannot archive guardian: they are the sole linked guardian for an actively enrolled student.',
        );
      }
    }
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const archivedAt = new Date();

  const archivedGuardian = await Guardian.findByIdAndUpdate(
    id,
    {
      $set: {
        status: 'ARCHIVED',
        archivedBy: userId,
        archivedAt,
        updatedBy: userId,
      },
    },
    { new: true },
  ).exec();

  if (!archivedGuardian) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Guardian not found.');
  }

  sendSuccess(res, 200, 'Guardian archived successfully', archivedGuardian.toJSON());
}
