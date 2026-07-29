import { Request, Response } from 'express';
import {
  CreateTimetableSlotSchema,
  UpdateTimetableSlotSchema,
  PublishTimetableSchema,
  ErrorCodes,
  PaginationMeta,
  DayOfWeek,
} from '@laps/shared';
import { Timetable } from '../models/Timetable';
import { ClassSubject } from '../models/ClassSubject';
import { Teacher } from '../models/Teacher';
import { TimetablePeriod } from '../models/TimetablePeriod';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

const ALL_DAYS: DayOfWeek[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export async function getMyTimetable(req: Request, res: Response): Promise<void> {
  const profileRef = req.user?.profileRef;
  if (!profileRef || !mongoose.Types.ObjectId.isValid(profileRef)) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Teacher profile reference required for my-timetable',
    );
  }

  const filter: Record<string, unknown> = {
    teacherId: profileRef,
    status: 'PUBLISHED',
  };
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.dayOfWeek) {
    filter.dayOfWeek = req.query.dayOfWeek;
  }

  const records = await Timetable.find(filter)
    .populate('classId', 'name code level')
    .populate('sectionId', 'name roomNumber maxCapacity')
    .populate('timetablePeriodId', 'name sequence startTime endTime isBreak')
    .populate('classSubjectId', 'isMandatory isOptional')
    .populate('subjectId', 'name code shortName subjectType')
    .populate('teacherId', 'firstName lastName employeeId email phone')
    .populate('roomId', 'name code roomType capacity')
    .sort({ dayOfWeek: 1 })
    .exec();

  sendSuccess(res, 200, 'My timetable retrieved successfully', records);
}

export async function getTimetables(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '50'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.classId) {
    filter.classId = req.query.classId;
  }
  if (req.query.sectionId) {
    filter.sectionId = req.query.sectionId;
  }
  if (req.query.teacherId) {
    filter.teacherId = req.query.teacherId;
  }
  if (req.query.roomId) {
    filter.roomId = req.query.roomId;
  }
  if (req.query.dayOfWeek) {
    filter.dayOfWeek = req.query.dayOfWeek;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // If TEACHER role is querying general timetable matrix, isolate to PUBLISHED only
  if (req.user?.role === 'TEACHER') {
    filter.status = 'PUBLISHED';
  }

  const [records, totalRecords] = await Promise.all([
    Timetable.find(filter)
      .populate('classId', 'name code level')
      .populate('sectionId', 'name roomNumber maxCapacity')
      .populate('timetablePeriodId', 'name sequence startTime endTime isBreak')
      .populate('classSubjectId', 'isMandatory isOptional')
      .populate('subjectId', 'name code shortName subjectType')
      .populate('teacherId', 'firstName lastName employeeId email phone')
      .populate('roomId', 'name code roomType capacity')
      .skip(skip)
      .limit(limit)
      .exec(),
    Timetable.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Timetables retrieved successfully', records, pagination);
}

export async function getTimetableById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid timetable slot ID');
  }

  const record = await Timetable.findById(id)
    .populate('classId', 'name code level')
    .populate('sectionId', 'name roomNumber maxCapacity')
    .populate('timetablePeriodId', 'name sequence startTime endTime isBreak')
    .populate('classSubjectId', 'isMandatory isOptional')
    .populate('subjectId', 'name code shortName subjectType')
    .populate('teacherId', 'firstName lastName employeeId email phone')
    .populate('roomId', 'name code roomType capacity')
    .exec();

  if (!record) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Timetable slot not found');
  }

  if (req.user?.role === 'TEACHER' && record.status !== 'PUBLISHED') {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Teacher can only access published timetable slots',
    );
  }

  sendSuccess(res, 200, 'Timetable slot retrieved successfully', record);
}

export async function createTimetableSlot(
  req: Request,
  res: Response,
): Promise<void> {
  const parseResult = CreateTimetableSlotSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const {
    academicSessionId,
    classId,
    sectionId,
    dayOfWeek,
    timetablePeriodId,
    classSubjectId,
    subjectId,
    teachingAssignmentId,
    teacherId,
    roomId,
  } = parseResult.data;

  // 1. Teacher Assignment Compatibility Validation
  const classSubject = await ClassSubject.findOne({
    _id: classSubjectId,
    academicSessionId,
    classId,
    subjectId,
    status: 'ACTIVE',
  }).exec();

  if (!classSubject) {
    throw new AppError(
      400,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      'Subject is not actively mapped to this class in the academic session',
    );
  }

  const teachingAssignment = await TeachingAssignment.findOne({
    _id: teachingAssignmentId,
    academicSessionId,
    classId,
    sectionId,
    subjectId,
    teacherId,
    status: 'ACTIVE',
  }).exec();

  if (!teachingAssignment) {
    throw new AppError(
      400,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      'Teacher is not actively assigned to teach this subject in this section',
    );
  }

  // 2. Conflict Detection (Teacher, Room, Section)
  // Teacher Conflict
  const teacherConflict = await Timetable.findOne({
    academicSessionId,
    teacherId,
    dayOfWeek,
    timetablePeriodId,
    status: { $in: ['DRAFT', 'PUBLISHED'] },
  }).exec();

  if (teacherConflict) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'Teacher is already scheduled in another section/room during this period',
    );
  }

  // Section Conflict
  const sectionConflict = await Timetable.findOne({
    academicSessionId,
    sectionId,
    dayOfWeek,
    timetablePeriodId,
    status: { $in: ['DRAFT', 'PUBLISHED'] },
  }).exec();

  if (sectionConflict) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'Section already has a subject scheduled during this period',
    );
  }

  // Room Conflict (if roomId is specified)
  if (roomId) {
    const roomConflict = await Timetable.findOne({
      academicSessionId,
      roomId,
      dayOfWeek,
      timetablePeriodId,
      status: { $in: ['DRAFT', 'PUBLISHED'] },
    }).exec();

    if (roomConflict) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        'Room is already booked by another class during this period',
      );
    }
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const newSlot = await Timetable.create({
    ...parseResult.data,
    createdBy: userId,
    updatedBy: userId,
  });

  const populated = await Timetable.findById(newSlot._id)
    .populate('classId', 'name code level')
    .populate('sectionId', 'name roomNumber maxCapacity')
    .populate('timetablePeriodId', 'name sequence startTime endTime isBreak')
    .populate('classSubjectId', 'isMandatory isOptional')
    .populate('subjectId', 'name code shortName subjectType')
    .populate('teacherId', 'firstName lastName employeeId email phone')
    .populate('roomId', 'name code roomType capacity')
    .exec();

  sendSuccess(res, 201, 'Timetable slot created successfully', populated);
}

export async function updateTimetableSlot(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid timetable slot ID');
  }

  const parseResult = UpdateTimetableSlotSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const slot = await Timetable.findById(id).exec();
  if (!slot) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Timetable slot not found');
  }

  const targetTeacherId = parseResult.data.teacherId || slot.teacherId;
  const targetRoomId = parseResult.data.roomId !== undefined ? parseResult.data.roomId : slot.roomId;
  const targetSubjectId = parseResult.data.subjectId || slot.subjectId;
  const targetClassSubjectId = parseResult.data.classSubjectId || slot.classSubjectId;

  // Verify Compatibility if subject or teacher changed
  if (
    parseResult.data.subjectId ||
    parseResult.data.classSubjectId ||
    parseResult.data.teacherId ||
    parseResult.data.teachingAssignmentId
  ) {
    const classSubject = await ClassSubject.findOne({
      _id: targetClassSubjectId,
      academicSessionId: slot.academicSessionId,
      classId: slot.classId,
      subjectId: targetSubjectId,
      status: 'ACTIVE',
    }).exec();

    if (!classSubject) {
      throw new AppError(
        400,
        ErrorCodes.BUSINESS_RULE_VIOLATION,
        'Subject is not actively mapped to this class in the academic session',
      );
    }
  }

  // Conflict Detection against other slots
  if (parseResult.data.teacherId && parseResult.data.teacherId !== slot.teacherId.toString()) {
    const teacherConflict = await Timetable.findOne({
      academicSessionId: slot.academicSessionId,
      teacherId: targetTeacherId,
      dayOfWeek: slot.dayOfWeek,
      timetablePeriodId: slot.timetablePeriodId,
      status: { $in: ['DRAFT', 'PUBLISHED'] },
      _id: { $ne: id },
    }).exec();

    if (teacherConflict) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        'Teacher is already scheduled in another section/room during this period',
      );
    }
  }

  if (targetRoomId) {
    const roomConflict = await Timetable.findOne({
      academicSessionId: slot.academicSessionId,
      roomId: targetRoomId,
      dayOfWeek: slot.dayOfWeek,
      timetablePeriodId: slot.timetablePeriodId,
      status: { $in: ['DRAFT', 'PUBLISHED'] },
      _id: { $ne: id },
    }).exec();

    if (roomConflict) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        'Room is already booked by another class during this period',
      );
    }
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  Object.assign(slot, parseResult.data);
  slot.updatedBy = new mongoose.Types.ObjectId(userId);
  await slot.save();

  const populated = await Timetable.findById(slot._id)
    .populate('classId', 'name code level')
    .populate('sectionId', 'name roomNumber maxCapacity')
    .populate('timetablePeriodId', 'name sequence startTime endTime isBreak')
    .populate('classSubjectId', 'isMandatory isOptional')
    .populate('subjectId', 'name code shortName subjectType')
    .populate('teacherId', 'firstName lastName employeeId email phone')
    .populate('roomId', 'name code roomType capacity')
    .exec();

  sendSuccess(res, 200, 'Timetable slot updated successfully', populated);
}

export async function publishTimetable(
  req: Request,
  res: Response,
): Promise<void> {
  const parseResult = PublishTimetableSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const filter: Record<string, unknown> = {
    academicSessionId: parseResult.data.academicSessionId,
    status: 'DRAFT',
  };
  if (parseResult.data.classId) {
    filter.classId = parseResult.data.classId;
  }
  if (parseResult.data.sectionId) {
    filter.sectionId = parseResult.data.sectionId;
  }
  if (parseResult.data.slotIds && parseResult.data.slotIds.length > 0) {
    filter._id = { $in: parseResult.data.slotIds };
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const updateResult = await Timetable.updateMany(filter, {
    $set: { status: 'PUBLISHED', updatedBy: userId },
  }).exec();

  sendSuccess(
    res,
    200,
    'Timetable published successfully',
    {
      publishedCount: updateResult.modifiedCount,
      message: `${updateResult.modifiedCount} timetable slots published successfully`,
    },
  );
}

export async function archiveTimetableSlot(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid timetable slot ID');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const slot = await Timetable.findById(id).exec();
  if (!slot) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Timetable slot not found');
  }

  slot.status = 'ARCHIVED';
  slot.archivedBy = new mongoose.Types.ObjectId(userId);
  slot.archivedAt = new Date();
  slot.updatedBy = new mongoose.Types.ObjectId(userId);
  await slot.save();

  sendSuccess(res, 200, 'Timetable slot archived successfully', slot);
}

export async function getTeacherWorkload(
  req: Request,
  res: Response,
): Promise<void> {
  const { teacherId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(teacherId)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid teacher ID');
  }

  const academicSessionId = String(
    req.query.academicSessionId || '',
  );
  if (!academicSessionId) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'academicSessionId query parameter is required',
    );
  }

  const teacher = await Teacher.findById(teacherId).exec();
  if (!teacher) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Teacher not found');
  }

  const activeSlots = await Timetable.find({
    academicSessionId,
    teacherId,
    status: { $in: ['DRAFT', 'PUBLISHED'] },
  })
    .populate('timetablePeriodId', 'isBreak')
    .exec();

  const periodsPerDay: Record<DayOfWeek, number> = {
    MONDAY: 0,
    TUESDAY: 0,
    WEDNESDAY: 0,
    THURSDAY: 0,
    FRIDAY: 0,
    SATURDAY: 0,
    SUNDAY: 0,
  };

  let totalPeriodsPerWeek = 0;

  for (const slot of activeSlots) {
    const periodDoc = slot.timetablePeriodId as unknown as { isBreak?: boolean };
    if (periodDoc && !periodDoc.isBreak) {
      if (ALL_DAYS.includes(slot.dayOfWeek)) {
        periodsPerDay[slot.dayOfWeek] = (periodsPerDay[slot.dayOfWeek] || 0) + 1;
        totalPeriodsPerWeek += 1;
      }
    }
  }

  // Count total non-break periods per week across the session to determine free periods
  const totalAvailablePeriods = await TimetablePeriod.countDocuments({
    academicSessionId,
    isBreak: false,
    status: 'ACTIVE',
  }).exec();

  // Typical week has 6 working days -> totalAvailablePeriods * 6
  const maxWeeklyPeriodsThreshold = 30;
  const freePeriodsPerWeek = Math.max(0, totalAvailablePeriods * 6 - totalPeriodsPerWeek);
  const isOverloaded = totalPeriodsPerWeek > maxWeeklyPeriodsThreshold;

  const workloadData = {
    teacherId: teacher.id || teacher._id.toString(),
    teacherName: `${teacher.firstName} ${teacher.lastName}`,
    academicSessionId,
    periodsPerDay,
    totalPeriodsPerWeek,
    freePeriodsPerWeek,
    maxWeeklyPeriodsThreshold,
    isOverloaded,
  };

  sendSuccess(res, 200, 'Teacher workload calculated successfully', workloadData);
}
