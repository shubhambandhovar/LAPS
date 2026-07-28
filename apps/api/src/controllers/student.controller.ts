import { Request, Response } from 'express';
import {
  CreateStudentSchema,
  UpdateStudentSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Student } from '../models/Student';
import { Guardian } from '../models/Guardian';
import { StudentGuardian } from '../models/StudentGuardian';
import { Enrollment } from '../models/Enrollment';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

export async function getStudents(
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
    const matchingEnrollments = await Enrollment.find({
      sectionId: { $in: req.teacherAssignedSectionIds },
      enrollmentStatus: 'ACTIVE',
    }).select('studentId').exec();
    const allowedStudentIds = matchingEnrollments.map((e) => e.studentId);
    filter._id = { $in: allowedStudentIds };
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.gender) {
    filter.gender = req.query.gender;
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.search && String(req.query.search).trim() !== '') {
    const searchTerm = String(req.query.search).trim();
    const regex = new RegExp(searchTerm, 'i');

    const matchingGuardians = await Guardian.find({
      $or: [
        { name: regex },
        { phone: regex },
      ],
    }).select('_id').exec();

    const guardianIds = matchingGuardians.map((g) => g._id);
    let linkedStudentIds: mongoose.Types.ObjectId[] = [];
    if (guardianIds.length > 0) {
      const studentGuardians = await StudentGuardian.find({
        guardianId: { $in: guardianIds },
      }).select('studentId').exec();
      linkedStudentIds = studentGuardians.map((sg) => sg.studentId);
    }

    const orConditions: Array<Record<string, unknown>> = [
      { admissionNumber: regex },
      { firstName: regex },
      { lastName: regex },
      { phone: regex },
    ];

    if (linkedStudentIds.length > 0) {
      orConditions.push({ _id: { $in: linkedStudentIds } });
    }

    filter.$or = orConditions;
  }

  const sortBy = String(req.query.sortBy || 'admissionNumber');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    Student.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Student.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Students retrieved successfully', records, pagination);
}

export async function getStudentById(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Student ID.');
  }

  const student = await Student.findById(id).exec();
  if (!student) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Student not found.');
  }

  const studentGuardians = await StudentGuardian.find({ studentId: id })
    .populate('guardianId')
    .exec();

  const linkedGuardians = studentGuardians.map((sg) => {
    const sgObj = sg.toJSON();
    const guardianObj = sg.guardianId ? (sg.guardianId as unknown as Record<string, unknown>) : undefined;
    return {
      id: sgObj.id,
      studentId: sgObj.studentId,
      guardianId: sgObj.guardianId,
      relationship: sgObj.relationship,
      isPrimaryGuardian: sgObj.isPrimaryGuardian,
      pickupPermission: sgObj.pickupPermission,
      emergencyContactPermission: sgObj.emergencyContactPermission,
      guardian: guardianObj,
    };
  });

  const enrollments = await Enrollment.find({ studentId: id })
    .populate('academicSessionId', 'name startDate endDate isCurrent status')
    .populate('classId', 'name code')
    .populate('sectionId', 'name')
    .sort({ enrollmentDate: -1 })
    .exec();

  const enrichedEnrollments = await Promise.all(
    enrollments.map(async (enr) => {
      const enrObj = enr.toJSON();
      const sessionObj = enr.academicSessionId as unknown as { name?: string };
      const classObj = enr.classId as unknown as { name?: string };
      const sectionObj = enr.sectionId as unknown as { name?: string };

      let classTeacher: Record<string, unknown> | undefined = undefined;
      const assignment = await TeachingAssignment.findOne({
        academicSessionId: enr.academicSessionId,
        classId: enr.classId,
        sectionId: enr.sectionId,
        isClassTeacher: true,
        status: 'ACTIVE',
      }).populate('teacherId', 'firstName lastName employeeId').exec();

      if (assignment && assignment.teacherId) {
        const tObj = assignment.teacherId as unknown as { _id?: unknown; id?: string; firstName: string; lastName: string; employeeId: string };
        classTeacher = {
          id: tObj.id || (tObj._id ? String(tObj._id) : undefined),
          firstName: tObj.firstName,
          lastName: tObj.lastName,
          employeeId: tObj.employeeId,
        };
      }

      return {
        ...enrObj,
        sessionName: sessionObj?.name,
        className: classObj?.name,
        sectionName: sectionObj?.name,
        classTeacher,
      };
    })
  );

  const currentEnrollment = enrichedEnrollments.find((e) => e.enrollmentStatus === 'ACTIVE');

  sendSuccess(res, 200, 'Student retrieved successfully', {
    student: {
      ...student.toJSON(),
      currentEnrollment,
    },
    guardians: linkedGuardians,
    enrollments: enrichedEnrollments,
  });
}

export async function createStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const result = CreateStudentSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  let admissionNumber = result.data.admissionNumber;
  if (!admissionNumber) {
    admissionNumber = await Student.generateAdmissionNumber();
  } else {
    const existing = await Student.findOne({ admissionNumber }).exec();
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        `Student with admission number ${admissionNumber} already exists.`,
      );
    }
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const student = await Student.create({
    ...result.data,
    admissionNumber,
    createdBy: userId,
    updatedBy: userId,
  });

  sendSuccess(res, 201, 'Student created successfully', student.toJSON());
}

export async function updateStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Student ID.');
  }

  const result = UpdateStudentSchema.safeParse(req.body);
  if (!result.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      result.error.errors[0].message,
      result.error.errors,
    );
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const updatedStudent = await Student.findByIdAndUpdate(
    id,
    {
      $set: {
        ...result.data,
        updatedBy: userId,
      },
    },
    { new: true, runValidators: true },
  ).exec();

  if (!updatedStudent) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Student not found.');
  }

  sendSuccess(res, 200, 'Student updated successfully', updatedStudent.toJSON());
}

export async function archiveStudent(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Student ID.');
  }

  const activeEnrollment = await Enrollment.findOne({
    studentId: id,
    enrollmentStatus: 'ACTIVE',
  }).exec();

  if (activeEnrollment) {
    throw new AppError(
      409,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      'Cannot archive a student with an active enrollment.',
    );
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);
  const archivedAt = new Date();

  const archivedStudent = await Student.findByIdAndUpdate(
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

  if (!archivedStudent) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Student not found.');
  }

  sendSuccess(res, 200, 'Student archived successfully', archivedStudent.toJSON());
}

export async function updateStudentStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid Student ID.');
  }

  const { status } = req.body;
  if (status !== 'ACTIVE' && status !== 'ARCHIVED') {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Student status must be either ACTIVE or ARCHIVED. Lifecycle transitions occur via Enrollment.',
    );
  }

  if (status === 'ARCHIVED') {
    const activeEnrollment = await Enrollment.findOne({
      studentId: id,
      enrollmentStatus: 'ACTIVE',
    }).exec();

    if (activeEnrollment) {
      throw new AppError(
        409,
        ErrorCodes.BUSINESS_RULE_VIOLATION,
        'Cannot archive a student with an active enrollment.',
      );
    }
  }

  const userId = new mongoose.Types.ObjectId(req.user!.id);

  const updatedStudent = await Student.findByIdAndUpdate(
    id,
    {
      $set: {
        status,
        updatedBy: userId,
        ...(status === 'ARCHIVED'
          ? { archivedBy: userId, archivedAt: new Date() }
          : { archivedBy: undefined, archivedAt: undefined }),
      },
    },
    { new: true },
  ).exec();

  if (!updatedStudent) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Student not found.');
  }

  sendSuccess(res, 200, 'Student status updated successfully', updatedStudent.toJSON());
}
