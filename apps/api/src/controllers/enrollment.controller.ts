import { Request, Response } from 'express';
import {
  CreateEnrollmentSchema,
  UpdateEnrollmentSchema,
  PromoteEnrollmentSchema,
  TransferEnrollmentSchema,
  WithdrawEnrollmentSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Enrollment } from '../models/Enrollment';
import { Student } from '../models/Student';
import { AcademicSession } from '../models/AcademicSession';
import { Class } from '../models/Class';
import { Section } from '../models/Section';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

async function getEnrichedClassTeacher(
  academicSessionId: unknown,
  classId: unknown,
  sectionId: unknown,
): Promise<Record<string, unknown> | undefined> {
  const assignment = await TeachingAssignment.findOne({
    academicSessionId,
    classId,
    sectionId,
    isClassTeacher: true,
    status: 'ACTIVE',
  })
    .populate('teacherId', 'firstName lastName employeeId')
    .exec();

  if (assignment && assignment.teacherId) {
    const tObj = assignment.teacherId as unknown as {
      _id?: unknown;
      id?: string;
      firstName: string;
      lastName: string;
      employeeId: string;
    };
    return {
      id: tObj.id || (tObj._id ? String(tObj._id) : undefined),
      firstName: tObj.firstName,
      lastName: tObj.lastName,
      employeeId: tObj.employeeId,
    };
  }
  return undefined;
}

export async function getEnrollments(
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

  if (req.teacherAssignedSectionIds && req.teacherAssignedSectionIds.length > 0) {
    filter.sectionId = { $in: req.teacherAssignedSectionIds };
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
  if (req.query.studentId) {
    filter.studentId = req.query.studentId;
  }
  if (req.query.enrollmentStatus) {
    filter.enrollmentStatus = req.query.enrollmentStatus;
  }

  const sortBy = String(req.query.sortBy || 'rollNumber');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    Enrollment.find(filter)
      .populate('studentId')
      .populate('academicSessionId', 'name startDate endDate isCurrent status')
      .populate('classId', 'name code')
      .populate('sectionId', 'name')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Enrollment.countDocuments(filter).exec(),
  ]);

  const enrichedRecords = await Promise.all(
    records.map(async (doc) => {
      const docObj = doc.toJSON();
      const studentObj = docObj.studentId ? (docObj.studentId as unknown as Record<string, unknown>) : undefined;
      const sessionObj = docObj.academicSessionId ? (docObj.academicSessionId as unknown as { name?: string }) : undefined;
      const classObj = docObj.classId ? (docObj.classId as unknown as { name?: string }) : undefined;
      const sectionObj = docObj.sectionId ? (docObj.sectionId as unknown as { name?: string }) : undefined;

      const classTeacher = await getEnrichedClassTeacher(
        doc.academicSessionId,
        doc.classId,
        doc.sectionId,
      );

      return {
        ...docObj,
        student: studentObj,
        sessionName: sessionObj?.name,
        className: classObj?.name,
        sectionName: sectionObj?.name,
        classTeacher,
      };
    }),
  );

  const totalPages = Math.ceil(totalRecords / limit) || 1;
  const pagination: PaginationMeta = {
    page,
    limit,
    totalRecords,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  sendSuccess(res, 200, 'Enrollments retrieved successfully', enrichedRecords, pagination);
}

export async function getEnrollmentById(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Enrollment ID.');
  }

  const enrollment = await Enrollment.findById(id)
    .populate('studentId')
    .populate('academicSessionId', 'name startDate endDate isCurrent status')
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .populate('promotedToEnrollmentId')
    .populate('previousEnrollmentId')
    .exec();

  if (!enrollment) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Enrollment not found.');
  }

  const docObj = enrollment.toJSON();
  const studentObj = docObj.studentId ? (docObj.studentId as unknown as Record<string, unknown>) : undefined;
  const sessionObj = docObj.academicSessionId ? (docObj.academicSessionId as unknown as { name?: string }) : undefined;
  const classObj = docObj.classId ? (docObj.classId as unknown as { name?: string }) : undefined;
  const sectionObj = docObj.sectionId ? (docObj.sectionId as unknown as { name?: string }) : undefined;

  const classTeacher = await getEnrichedClassTeacher(
    enrollment.academicSessionId,
    enrollment.classId,
    enrollment.sectionId,
  );

  sendSuccess(res, 200, 'Enrollment retrieved successfully', {
    ...docObj,
    student: studentObj,
    sessionName: sessionObj?.name,
    className: classObj?.name,
    sectionName: sectionObj?.name,
    classTeacher,
  });
}

export async function createEnrollment(
  req: Request,
  res: Response,
): Promise<void> {
  const result = CreateEnrollmentSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const { studentId, academicSessionId, classId, sectionId } = result.data;

  if (
    !mongoose.Types.ObjectId.isValid(studentId) ||
    !mongoose.Types.ObjectId.isValid(academicSessionId) ||
    !mongoose.Types.ObjectId.isValid(classId) ||
    !mongoose.Types.ObjectId.isValid(sectionId)
  ) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid foreign key ID.');
  }

  const [student, session, cls, sec, existingSessionEnrollment] = await Promise.all([
    Student.findById(studentId).exec(),
    AcademicSession.findById(academicSessionId).exec(),
    Class.findById(classId).exec(),
    Section.findById(sectionId).exec(),
    Enrollment.findOne({ studentId, academicSessionId }).exec(),
  ]);

  if (!student) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Student not found.');
  }
  if (!session) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Academic Session not found.');
  }
  if (!cls) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Class not found.');
  }
  if (!sec) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Section not found.');
  }
  if (existingSessionEnrollment) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'Student is already enrolled in this academic session.',
    );
  }

  let rollNumber = result.data.rollNumber;
  if (typeof rollNumber !== 'number') {
    rollNumber = await Enrollment.generateRollNumber(academicSessionId, classId, sectionId);
  } else {
    const existingRoll = await Enrollment.findOne({
      academicSessionId,
      classId,
      sectionId,
      rollNumber,
    }).exec();

    if (existingRoll) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        `Roll number ${rollNumber} is already assigned in this section.`,
      );
    }
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const enrollment = await Enrollment.create({
    ...result.data,
    rollNumber,
    createdBy: userId,
    updatedBy: userId,
  });

  const populated = await Enrollment.findById(enrollment._id)
    .populate('studentId')
    .populate('academicSessionId', 'name startDate endDate isCurrent status')
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .exec();

  sendSuccess(res, 201, 'Enrollment created successfully', populated ? populated.toJSON() : enrollment.toJSON());
}

export async function updateEnrollment(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Enrollment ID.');
  }

  const result = UpdateEnrollmentSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const existing = await Enrollment.findById(id).exec();
  if (!existing) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Enrollment not found.');
  }

  if (
    result.data.rollNumber !== undefined &&
    result.data.rollNumber !== existing.rollNumber
  ) {
    const sectionToUse = result.data.sectionId || existing.sectionId;
    const existingRoll = await Enrollment.findOne({
      academicSessionId: existing.academicSessionId,
      classId: existing.classId,
      sectionId: sectionToUse,
      rollNumber: result.data.rollNumber,
      _id: { $ne: existing._id },
    }).exec();

    if (existingRoll) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        `Roll number ${result.data.rollNumber} is already assigned in this section.`,
      );
    }
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const updated = await Enrollment.findByIdAndUpdate(
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
    .populate('academicSessionId', 'name startDate endDate isCurrent status')
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .exec();

  if (!updated) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Enrollment not found.');
  }

  sendSuccess(res, 200, 'Enrollment updated successfully', updated.toJSON());
}

export async function archiveEnrollment(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Enrollment ID.');
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const archivedAt = new Date();

  const archived = await Enrollment.findByIdAndUpdate(
    id,
    {
      $set: {
        enrollmentStatus: 'ARCHIVED',
        archivedBy: userId,
        archivedAt,
        updatedBy: userId,
      },
    },
    { new: true },
  )
    .populate('studentId')
    .exec();

  if (!archived) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Enrollment not found.');
  }

  sendSuccess(res, 200, 'Enrollment archived successfully', archived.toJSON());
}

export async function promoteEnrollment(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Enrollment ID.');
  }

  const result = PromoteEnrollmentSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const { targetAcademicSessionId, targetClassId, targetSectionId, rollNumber, remarks } = result.data;

  const currentEnrollment = await Enrollment.findById(id).exec();
  if (!currentEnrollment) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Source enrollment not found.');
  }

  const existingInTargetSession = await Enrollment.findOne({
    studentId: currentEnrollment.studentId,
    academicSessionId: targetAcademicSessionId,
  }).exec();

  if (existingInTargetSession) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'Student is already enrolled in the target academic session.',
    );
  }

  let finalRollNumber = rollNumber;
  if (typeof finalRollNumber !== 'number') {
    finalRollNumber = await Enrollment.generateRollNumber(
      targetAcademicSessionId,
      targetClassId,
      targetSectionId,
    );
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const newEnrollment = await Enrollment.create({
    studentId: currentEnrollment.studentId,
    academicSessionId: targetAcademicSessionId,
    classId: targetClassId,
    sectionId: targetSectionId,
    rollNumber: finalRollNumber,
    enrollmentStatus: 'ACTIVE',
    previousEnrollmentId: currentEnrollment._id,
    remarks,
    createdBy: userId,
    updatedBy: userId,
  });

  currentEnrollment.enrollmentStatus = 'PROMOTED';
  currentEnrollment.promotedToEnrollmentId = newEnrollment._id as mongoose.Types.ObjectId;
  currentEnrollment.updatedBy = userId;
  await currentEnrollment.save();

  const populated = await Enrollment.findById(newEnrollment._id)
    .populate('studentId')
    .populate('academicSessionId', 'name startDate endDate isCurrent status')
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .exec();

  sendSuccess(res, 201, 'Student promoted successfully', populated ? populated.toJSON() : newEnrollment.toJSON());
}

export async function transferEnrollment(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Enrollment ID.');
  }

  const result = TransferEnrollmentSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const updated = await Enrollment.findByIdAndUpdate(
    id,
    {
      $set: {
        enrollmentStatus: 'TRANSFERRED',
        remarks: result.data.remarks,
        updatedBy: userId,
      },
    },
    { new: true },
  )
    .populate('studentId')
    .populate('academicSessionId', 'name startDate endDate isCurrent status')
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .exec();

  if (!updated) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Enrollment not found.');
  }

  sendSuccess(res, 200, 'Student transferred successfully', updated.toJSON());
}

export async function withdrawEnrollment(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Enrollment ID.');
  }

  const result = WithdrawEnrollmentSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const updated = await Enrollment.findByIdAndUpdate(
    id,
    {
      $set: {
        enrollmentStatus: 'WITHDRAWN',
        remarks: result.data.remarks,
        updatedBy: userId,
      },
    },
    { new: true },
  )
    .populate('studentId')
    .populate('academicSessionId', 'name startDate endDate isCurrent status')
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .exec();

  if (!updated) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Enrollment not found.');
  }

  sendSuccess(res, 200, 'Student withdrawn successfully', updated.toJSON());
}
