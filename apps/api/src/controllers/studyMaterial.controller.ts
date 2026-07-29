import { Request, Response } from 'express';
import {
  CreateStudyMaterialSchema,
  UpdateStudyMaterialSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { StudyMaterial } from '../models/StudyMaterial';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Timetable } from '../models/Timetable';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * Helper: Verify Teacher has active TeachingAssignment and Timetable is PUBLISHED
 */
async function verifyTeacherScope(
  user: any,
  academicSessionId: string,
  teachingAssignmentId: string,
  classId: string,
  sectionId: string,
  subjectId: string
): Promise<void> {
  const isAdmin =
    user.role === 'SUPER_ADMIN' ||
    user.role === 'SCHOOL_ADMIN' ||
    user.roles?.includes('SUPER_ADMIN') ||
    user.roles?.includes('SCHOOL_ADMIN');
  if (isAdmin) {
    return;
  }

  const ta = await TeachingAssignment.findOne({
    _id: teachingAssignmentId,
    academicSessionId,
    classId,
    sectionId,
    subjectId,
    status: 'ACTIVE',
  });

  if (!ta) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'RBAC_PERMISSION_DENIED: You do not have an active teaching assignment for this class, section, and subject'
    );
  }

  const timetable = await Timetable.findOne({
    academicSessionId,
    classId,
    sectionId,
    status: 'PUBLISHED',
  });

  if (!timetable) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'RBAC_PERMISSION_DENIED: Cannot publish study material for an unpublished timetable'
    );
  }
}

/**
 * GET /api/v1/study-material
 * List study materials with pagination, filtering, and release/expire window check
 */
export async function getStudyMaterialList(req: Request, res: Response): Promise<void> {
  const {
    academicSessionId,
    classId,
    sectionId,
    subjectId,
    uploaderTeacherId,
    materialType,
    search,
    page = '1',
    limit = '20',
  } = req.query;

  const filter: any = { status: { $ne: 'ARCHIVED' } };
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  if (classId) filter.classId = classId;
  if (sectionId) filter.sectionId = sectionId;
  if (subjectId) filter.subjectId = subjectId;
  if (uploaderTeacherId) filter.uploaderTeacherId = uploaderTeacherId;
  if (materialType) filter.materialType = materialType;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // If student, check release/expire windows
  const user = (req as any).user;
  if (user.role === 'STUDENT' || user.roles?.includes('STUDENT')) {
    const now = new Date();
    filter.$and = [
      { $or: [{ publishAt: { $exists: false } }, { publishAt: null }, { publishAt: { $lte: now } }] },
      { $or: [{ expireAt: { $exists: false } }, { expireAt: null }, { expireAt: { $gte: now } }] },
    ];
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));

  const [items, totalRecords] = await Promise.all([
    StudyMaterial.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name code')
      .populate('uploaderTeacherId', 'firstName lastName employeeId'),
    StudyMaterial.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalRecords / limitNum) || 1;
  const pagination: PaginationMeta = {
    page: pageNum,
    limit: limitNum,
    totalRecords,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  };

  sendSuccess(
    res,
    200,
    'Study materials retrieved successfully',
    items,
    pagination
  );
}

/**
 * GET /api/v1/study-material/:id
 * Retrieve single study material with full version history
 */
export async function getStudyMaterialById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const material = await StudyMaterial.findOne({
    _id: id,
    status: { $ne: 'ARCHIVED' },
  })
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .populate('uploaderTeacherId', 'firstName lastName employeeId');

  if (!material) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Study material not found');
  }

  sendSuccess(res, 200, 'Study material retrieved successfully', material);
}

/**
 * POST /api/v1/study-material
 * Create study material with initial version history snapshot
 */
export async function createStudyMaterial(req: Request, res: Response): Promise<void> {
  const parseResult = CreateStudyMaterialSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0]?.message || 'Invalid study material payload'
    );
  }

  const data = parseResult.data;
  const user = (req as any).user;

  await verifyTeacherScope(
    user,
    data.academicSessionId,
    data.teachingAssignmentId,
    data.classId,
    data.sectionId,
    data.subjectId
  );

  const initialSnapshot = {
    version: 1,
    fileUrl: data.fileUrl,
    materialType: data.materialType,
    changedAt: new Date(),
    changedBy: user.id || user.userId || user._id,
    changelog: data.changelog || 'Initial upload',
  };

  const newMaterial = await StudyMaterial.create({
    ...data,
    uploaderTeacherId: data.uploaderTeacherId || user.profileRef || user.id || user.userId || user._id,
    versionHistory: [initialSnapshot],
    currentVersion: 1,
    status: 'ACTIVE',
    createdBy: user.id || user.userId || user._id,
    updatedBy: user.id || user.userId || user._id,
  });

  sendSuccess(res, 201, 'Study material created successfully', newMaterial);
}

/**
 * PUT /api/v1/study-material/:id
 * Update study material or upload new version (appends to versionHistory)
 */
export async function updateStudyMaterial(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = UpdateStudyMaterialSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0]?.message || 'Invalid update payload'
    );
  }

  const material = await StudyMaterial.findOne({
    _id: id,
    status: { $ne: 'ARCHIVED' },
  });

  if (!material) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Study material not found');
  }

  const user = (req as any).user;
  await verifyTeacherScope(
    user,
    String(material.academicSessionId),
    String(material.teachingAssignmentId),
    String(material.classId),
    String(material.sectionId),
    String(material.subjectId)
  );

  const data = parseResult.data;
  const urlChanged = data.fileUrl && data.fileUrl !== material.fileUrl;
  const typeChanged = data.materialType && data.materialType !== material.materialType;

  if (urlChanged || typeChanged || data.changelog) {
    const nextVersion = material.currentVersion + 1;
    const newSnapshot = {
      version: nextVersion,
      fileUrl: data.fileUrl || material.fileUrl,
      materialType: data.materialType || material.materialType,
      changedAt: new Date(),
      changedBy: user.id || user.userId || user._id,
      changelog: data.changelog || `Updated to version ${nextVersion}`,
    };
    material.versionHistory.push(newSnapshot);
    material.currentVersion = nextVersion;
    if (data.fileUrl) material.fileUrl = data.fileUrl;
  }

  Object.assign(material, {
    ...data,
    updatedBy: user.id || user.userId || user._id,
  });

  await material.save();
  sendSuccess(res, 200, 'Study material updated successfully', material);
}

/**
 * PATCH /api/v1/study-material/:id/archive
 * Soft-archive study material
 */
export async function archiveStudyMaterial(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = (req as any).user;

  const material = await StudyMaterial.findOne({
    _id: id,
    status: { $ne: 'ARCHIVED' },
  });

  if (!material) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Study material not found');
  }

  await verifyTeacherScope(
    user,
    String(material.academicSessionId),
    String(material.teachingAssignmentId),
    String(material.classId),
    String(material.sectionId),
    String(material.subjectId)
  );

  material.status = 'ARCHIVED';
  material.archivedBy = user.id || user.userId || user._id;
  material.archivedAt = new Date();
  material.updatedBy = user.id || user.userId || user._id;

  await material.save();
  sendSuccess(res, 200, 'Study material archived successfully', {
    id: material._id,
    status: 'ARCHIVED',
  });
}
