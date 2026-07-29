import { Request, Response } from 'express';
import {
  CreateAcademicTermSchema,
  UpdateAcademicTermSchema,
  CreateClassSubjectSchema,
  UpdateClassSubjectSchema,
  CreateRoomSchema,
  UpdateRoomSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { AcademicTerm } from '../models/AcademicTerm';
import { ClassSubject } from '../models/ClassSubject';
import { Room } from '../models/Room';
import { Class } from '../models/Class';
import { Subject } from '../models/Subject';
import { AcademicSession } from '../models/AcademicSession';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';
import mongoose from 'mongoose';

// AcademicTerm Handlers
export async function getAcademicTerms(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '20'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search), 'i');
    filter.$or = [{ name: searchRegex }, { code: searchRegex }];
  }

  const sortBy = String(req.query.sortBy || 'orderSequence');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    AcademicTerm.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    AcademicTerm.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Academic terms retrieved successfully', records, pagination);
}

export async function getAcademicTermById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid academic term ID');
  }

  const term = await AcademicTerm.findById(id).exec();
  if (!term) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Academic term not found');
  }

  sendSuccess(res, 200, 'Academic term retrieved successfully', term);
}

export async function createAcademicTerm(req: Request, res: Response): Promise<void> {
  const parseResult = CreateAcademicTermSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const sessionExists = await AcademicSession.findById(
    parseResult.data.academicSessionId,
  ).exec();
  if (!sessionExists) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Academic session not found');
  }

  const existingCode = await AcademicTerm.findOne({
    academicSessionId: parseResult.data.academicSessionId,
    code: parseResult.data.code,
  }).exec();
  if (existingCode) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'Academic term code already exists for this session',
    );
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const newTerm = await AcademicTerm.create({
    ...parseResult.data,
    createdBy: userId,
    updatedBy: userId,
  });

  sendSuccess(res, 201, 'Academic term created successfully', newTerm);
}

export async function updateAcademicTerm(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid academic term ID');
  }

  const parseResult = UpdateAcademicTermSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const term = await AcademicTerm.findById(id).exec();
  if (!term) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Academic term not found');
  }

  if (parseResult.data.code && parseResult.data.code !== term.code) {
    const existing = await AcademicTerm.findOne({
      academicSessionId: term.academicSessionId,
      code: parseResult.data.code,
      _id: { $ne: id },
    }).exec();
    if (existing) {
      throw new AppError(
        409,
        ErrorCodes.DUPLICATE_RESOURCE,
        'Academic term code already exists for this session',
      );
    }
  }

  Object.assign(term, parseResult.data);
  term.updatedBy = new mongoose.Types.ObjectId(userId);
  await term.save();

  sendSuccess(res, 200, 'Academic term updated successfully', term);
}

export async function archiveAcademicTerm(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid academic term ID');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const term = await AcademicTerm.findById(id).exec();
  if (!term) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Academic term not found');
  }

  term.status = 'ARCHIVED';
  term.archivedBy = new mongoose.Types.ObjectId(userId);
  term.archivedAt = new Date();
  term.updatedBy = new mongoose.Types.ObjectId(userId);
  await term.save();

  sendSuccess(res, 200, 'Academic term archived successfully', term);
}

// ClassSubject Handlers
export async function getClassSubjects(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '20'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.academicSessionId) {
    filter.academicSessionId = req.query.academicSessionId;
  }
  if (req.query.classId) {
    filter.classId = req.query.classId;
  }
  if (req.query.subjectId) {
    filter.subjectId = req.query.subjectId;
  }
  if (req.query.isMandatory !== undefined) {
    filter.isMandatory = req.query.isMandatory === 'true';
  }
  if (req.query.isOptional !== undefined) {
    filter.isOptional = req.query.isOptional === 'true';
  }
  if (req.query.subjectGroup) {
    filter.subjectGroup = req.query.subjectGroup;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const sortBy = String(req.query.sortBy || 'orderSequence');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    ClassSubject.find(filter)
      .populate('classId', 'name code level')
      .populate('subjectId', 'name code shortName subjectType')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    ClassSubject.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Class subjects retrieved successfully', records, pagination);
}

export async function getClassSubjectById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid class-subject ID');
  }

  const record = await ClassSubject.findById(id)
    .populate('classId', 'name code level')
    .populate('subjectId', 'name code shortName subjectType')
    .exec();
  if (!record) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Class-subject mapping not found');
  }

  sendSuccess(res, 200, 'Class subject retrieved successfully', record);
}

export async function createClassSubject(req: Request, res: Response): Promise<void> {
  const parseResult = CreateClassSubjectSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const [sessionExists, classExists, subjectExists] = await Promise.all([
    AcademicSession.findById(parseResult.data.academicSessionId).exec(),
    Class.findById(parseResult.data.classId).exec(),
    Subject.findById(parseResult.data.subjectId).exec(),
  ]);

  if (!sessionExists) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Academic session not found');
  }
  if (!classExists) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Class not found');
  }
  if (!subjectExists) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Subject not found');
  }

  const existingMapping = await ClassSubject.findOne({
    academicSessionId: parseResult.data.academicSessionId,
    classId: parseResult.data.classId,
    subjectId: parseResult.data.subjectId,
  }).exec();
  if (existingMapping) {
    throw new AppError(
      409,
      ErrorCodes.DUPLICATE_RESOURCE,
      'Subject is already mapped to this class in the academic session',
    );
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const record = await ClassSubject.create({
    ...parseResult.data,
    createdBy: userId,
    updatedBy: userId,
  });

  const populated = await ClassSubject.findById(record._id)
    .populate('classId', 'name code level')
    .populate('subjectId', 'name code shortName subjectType')
    .exec();

  sendSuccess(res, 201, 'Class subject created successfully', populated);
}

export async function updateClassSubject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid class-subject ID');
  }

  const parseResult = UpdateClassSubjectSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const record = await ClassSubject.findById(id).exec();
  if (!record) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Class-subject mapping not found');
  }

  Object.assign(record, parseResult.data);
  record.updatedBy = new mongoose.Types.ObjectId(userId);
  await record.save();

  const populated = await ClassSubject.findById(record._id)
    .populate('classId', 'name code level')
    .populate('subjectId', 'name code shortName subjectType')
    .exec();

  sendSuccess(res, 200, 'Class subject updated successfully', populated);
}

export async function archiveClassSubject(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid class-subject ID');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const record = await ClassSubject.findById(id).exec();
  if (!record) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Class-subject mapping not found');
  }

  record.status = 'ARCHIVED';
  record.archivedBy = new mongoose.Types.ObjectId(userId);
  record.archivedAt = new Date();
  record.updatedBy = new mongoose.Types.ObjectId(userId);
  await record.save();

  sendSuccess(res, 200, 'Class subject archived successfully', record);
}

// Room Handlers
export async function getRooms(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(req.query.limit || '20'), 10)),
  );
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.roomType) {
    filter.roomType = req.query.roomType;
  }
  if (req.query.building) {
    filter.building = req.query.building;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search), 'i');
    filter.$or = [{ name: searchRegex }, { code: searchRegex }, { building: searchRegex }];
  }

  const sortBy = String(req.query.sortBy || 'code');
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

  const [records, totalRecords] = await Promise.all([
    Room.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec(),
    Room.countDocuments(filter).exec(),
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

  sendSuccess(res, 200, 'Rooms retrieved successfully', records, pagination);
}

export async function getRoomById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid room ID');
  }

  const room = await Room.findById(id).exec();
  if (!room) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Room not found');
  }

  sendSuccess(res, 200, 'Room retrieved successfully', room);
}

export async function createRoom(req: Request, res: Response): Promise<void> {
  const parseResult = CreateRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const existingCode = await Room.findOne({
    code: parseResult.data.code,
  }).exec();
  if (existingCode) {
    throw new AppError(409, ErrorCodes.DUPLICATE_RESOURCE, 'Room code already exists');
  }

  const existingName = await Room.findOne({
    name: parseResult.data.name,
  }).exec();
  if (existingName) {
    throw new AppError(409, ErrorCodes.DUPLICATE_RESOURCE, 'Room name already exists');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const room = await Room.create({
    ...parseResult.data,
    createdBy: userId,
    updatedBy: userId,
  });

  sendSuccess(res, 201, 'Room created successfully', room);
}

export async function updateRoom(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid room ID');
  }

  const parseResult = UpdateRoomSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0].message,
    );
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const room = await Room.findById(id).exec();
  if (!room) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Room not found');
  }

  if (parseResult.data.code && parseResult.data.code !== room.code) {
    const existing = await Room.findOne({
      code: parseResult.data.code,
      _id: { $ne: id },
    }).exec();
    if (existing) {
      throw new AppError(409, ErrorCodes.DUPLICATE_RESOURCE, 'Room code already exists');
    }
  }

  if (parseResult.data.name && parseResult.data.name !== room.name) {
    const existing = await Room.findOne({
      name: parseResult.data.name,
      _id: { $ne: id },
    }).exec();
    if (existing) {
      throw new AppError(409, ErrorCodes.DUPLICATE_RESOURCE, 'Room name already exists');
    }
  }

  Object.assign(room, parseResult.data);
  room.updatedBy = new mongoose.Types.ObjectId(userId);
  await room.save();

  sendSuccess(res, 200, 'Room updated successfully', room);
}

export async function archiveRoom(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid room ID');
  }

  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Unauthorized');
  }

  const room = await Room.findById(id).exec();
  if (!room) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Room not found');
  }

  room.status = 'ARCHIVED';
  room.archivedBy = new mongoose.Types.ObjectId(userId);
  room.archivedAt = new Date();
  room.updatedBy = new mongoose.Types.ObjectId(userId);
  await room.save();

  sendSuccess(res, 200, 'Room archived successfully', room);
}
