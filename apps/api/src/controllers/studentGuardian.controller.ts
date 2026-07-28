import { Request, Response } from 'express';
import {
  CreateStudentGuardianSchema,
  UpdateStudentGuardianSchema,
  ErrorCodes,
} from '@laps/shared';
import { StudentGuardian } from '../models/StudentGuardian';
import { Student } from '../models/Student';
import { Guardian } from '../models/Guardian';
import { Enrollment } from '../models/Enrollment';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getStudentGuardians(
  req: Request,
  res: Response,
): Promise<void> {
  const filter: Record<string, unknown> = {};

  if (req.query.studentId) {
    if (!mongoose.Types.ObjectId.isValid(String(req.query.studentId))) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid studentId.');
    }
    filter.studentId = req.query.studentId;
  }

  if (req.query.guardianId) {
    if (!mongoose.Types.ObjectId.isValid(String(req.query.guardianId))) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid guardianId.');
    }
    filter.guardianId = req.query.guardianId;
  }

  const records = await StudentGuardian.find(filter)
    .populate('studentId')
    .populate('guardianId')
    .sort({ createdAt: -1 })
    .exec();

  const formatted = records.map((sg) => {
    const sgObj = sg.toJSON();
    return {
      ...sgObj,
      student: sgObj.studentId ? (sgObj.studentId as unknown as Record<string, unknown>) : undefined,
      guardian: sgObj.guardianId ? (sgObj.guardianId as unknown as Record<string, unknown>) : undefined,
    };
  });

  sendSuccess(res, 200, 'Student-Guardian relationships retrieved successfully', formatted);
}

export async function createStudentGuardian(
  req: Request,
  res: Response,
): Promise<void> {
  const result = CreateStudentGuardianSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const { studentId, guardianId, relationship, isPrimaryGuardian, pickupPermission, emergencyContactPermission } = result.data;

  if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(guardianId)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Student ID or Guardian ID.');
  }

  const [student, guardian, existing] = await Promise.all([
    Student.findById(studentId).exec(),
    Guardian.findById(guardianId).exec(),
    StudentGuardian.findOne({ studentId, guardianId }).exec(),
  ]);

  if (!student) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Student not found.');
  }
  if (!guardian) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Guardian not found.');
  }
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'This guardian is already linked to this student.',
    );
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  if (isPrimaryGuardian) {
    await StudentGuardian.updateMany(
      { studentId },
      { $set: { isPrimaryGuardian: false, updatedBy: userId } },
    ).exec();
  } else {
    const primaryExists = await StudentGuardian.findOne({
      studentId,
      isPrimaryGuardian: true,
    }).exec();

    if (!primaryExists) {
      result.data.isPrimaryGuardian = true;
    }
  }

  const record = await StudentGuardian.create({
    studentId,
    guardianId,
    relationship,
    isPrimaryGuardian: result.data.isPrimaryGuardian,
    pickupPermission,
    emergencyContactPermission,
    createdBy: userId,
    updatedBy: userId,
  });

  const populated = await StudentGuardian.findById(record._id)
    .populate('studentId')
    .populate('guardianId')
    .exec();

  sendSuccess(res, 201, 'Student-Guardian relationship created successfully', populated ? populated.toJSON() : record.toJSON());
}

export async function updateStudentGuardian(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid StudentGuardian ID.');
  }

  const result = UpdateStudentGuardianSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const existing = await StudentGuardian.findById(id).exec();
  if (!existing) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Relationship not found.');
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  if (result.data.isPrimaryGuardian === true) {
    await StudentGuardian.updateMany(
      { studentId: existing.studentId, _id: { $ne: existing._id } },
      { $set: { isPrimaryGuardian: false, updatedBy: userId } },
    ).exec();
  }

  const updated = await StudentGuardian.findByIdAndUpdate(
    id,
    {
      $set: {
        ...result.data,
        updatedBy: userId,
      },
    },
    { new: true, runValidators: true },
  )
    .populate('studentId')
    .populate('guardianId')
    .exec();

  if (!updated) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Relationship not found.');
  }

  sendSuccess(res, 200, 'Student-Guardian relationship updated successfully', updated.toJSON());
}

export async function deleteStudentGuardian(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid StudentGuardian ID.');
  }

  const existing = await StudentGuardian.findById(id).exec();
  if (!existing) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Relationship not found.');
  }

  const count = await StudentGuardian.countDocuments({
    studentId: existing.studentId,
  }).exec();

  if (count <= 1) {
    const activeEnrollment = await Enrollment.findOne({
      studentId: existing.studentId,
      enrollmentStatus: 'ACTIVE',
    }).exec();

    if (activeEnrollment) {
      throw new AppError(
        409,
        ErrorCodes.BUSINESS_RULE_VIOLATION,
        'Cannot remove sole guardian of an actively enrolled student.',
      );
    }
  }

  await StudentGuardian.findByIdAndDelete(id).exec();

  if (existing.isPrimaryGuardian && count > 1) {
    const remaining = await StudentGuardian.findOne({
      studentId: existing.studentId,
    }).exec();
    if (remaining) {
      remaining.isPrimaryGuardian = true;
      await remaining.save();
    }
  }

  sendSuccess(res, 200, 'Student-Guardian relationship deleted successfully', { deleted: true, id });
}
