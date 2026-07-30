import { Request, Response } from 'express';
import {
  CreateNoticeSchema,
  UpdateNoticeSchema,
  ErrorCodes,
} from '@laps/shared';
import { Notice } from '../models/Notice';
import { Enrollment } from '../models/Enrollment';
import { Student } from '../models/Student';
import { DeliveryLog } from '../models/DeliveryLog';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listNotices = async (req: Request, res: Response): Promise<void> => {
  const user = req.user;
  const {
    type,
    status = 'PUBLISHED',
    targetRole,
    classId,
    sectionId,
    page = '1',
    limit = '20',
  } = req.query;

  const query: Record<string, unknown> = {};

  if (user && user.role !== 'SUPER_ADMIN' && user.role !== 'SCHOOL_ADMIN' && user.role !== 'TEACHER') {
    query.status = 'PUBLISHED';
    query.$or = [
      { expiryDate: { $exists: false } },
      { expiryDate: null },
      { expiryDate: { $gte: new Date() } },
    ];

    let classIds: any[] = [];
    let sectionIds: any[] = [];
    if (user.role === 'STUDENT') {
      const studentProfile = await Student.findOne({
        $or: [
          { userId: user.id },
          { _id: user.profileRef || user.id },
        ],
      });
      const studentIdToSearch = studentProfile ? studentProfile._id : user.id;
      const enrollments = await Enrollment.find({ studentId: studentIdToSearch, enrollmentStatus: 'ACTIVE' });
      classIds = enrollments.map((e) => e.classId);
      sectionIds = enrollments.map((e) => e.sectionId);
    }

    query.$and = [
      {
        $or: [
          { targetRoles: 'ALL' },
          { targetRoles: user.role },
        ],
      },
      {
        $or: [
          { targetClassIds: { $exists: false } },
          { targetClassIds: { $size: 0 } },
          { targetClassIds: { $in: classIds } },
        ],
      },
      {
        $or: [
          { targetSectionIds: { $exists: false } },
          { targetSectionIds: { $size: 0 } },
          { targetSectionIds: { $in: sectionIds } },
        ],
      },
    ];
  } else {
    // For Admins and Teachers
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (targetRole && targetRole !== 'ALL') {
      query.targetRoles = targetRole;
    }
    if (classId) {
      query.targetClassIds = classId;
    }
    if (sectionId) {
      query.targetSectionIds = sectionId;
    }
  }

  if (type && type !== 'ALL') {
    query.type = type;
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [notices, total] = await Promise.all([
    Notice.find(query)
      .sort({ publishDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('authorId', 'profile.firstName profile.lastName email role'),
    Notice.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Notices retrieved successfully', {
    notices,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const listAdminNotices = async (req: Request, res: Response): Promise<void> => {
  const { status, type, page = '1', limit = '20' } = req.query;

  const query: Record<string, unknown> = {};

  if (req.user?.role === 'TEACHER') {
    query.authorId = req.user.id;
  }

  if (status && status !== 'ALL') {
    query.status = status;
  }
  if (type && type !== 'ALL') {
    query.type = type;
  }

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [notices, total] = await Promise.all([
    Notice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('authorId', 'profile.firstName profile.lastName email role'),
    Notice.countDocuments(query),
  ]);

  sendSuccess(res, 200, 'Admin notices retrieved successfully', {
    notices,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getNoticeById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const notice = await Notice.findById(id).populate(
    'authorId',
    'profile.firstName profile.lastName email role'
  );

  if (!notice) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notice not found');
  }

  sendSuccess(res, 200, 'Notice retrieved successfully', notice);
};

export const createNotice = async (req: Request, res: Response): Promise<void> => {
  const validated = CreateNoticeSchema.parse(req.body);

  const publishDate =
    validated.status === 'PUBLISHED'
      ? validated.publishDate
        ? new Date(validated.publishDate)
        : new Date()
      : undefined;

  const notice = await Notice.create({
    ...validated,
    publishDate,
    authorId: req.user?.id,
  });

  if (notice.status === 'PUBLISHED') {
    // Log broadcast delivery telemetry
    const authorId = req.user?.id;
    await DeliveryLog.create({
      noticeId: notice._id,
      recipientId: authorId,
      channel: 'IN_APP',
      status: 'DELIVERED',
      deliveredAt: new Date(),
    });
  }

  sendSuccess(res, 201, 'Notice created successfully', notice);
};

export const updateNotice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = UpdateNoticeSchema.parse(req.body);

  const existing = await Notice.findById(id);
  if (!existing) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notice not found');
  }

  if (
    req.user?.role === 'TEACHER' &&
    existing.authorId.toString() !== req.user.id.toString()
  ) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Teachers can only modify their own notices'
    );
  }

  let publishDate = existing.publishDate;
  if (validated.status === 'PUBLISHED' && !existing.publishDate) {
    publishDate = new Date();
  }

  const notice = await Notice.findByIdAndUpdate(
    id,
    { $set: { ...validated, publishDate } },
    { new: true, runValidators: true }
  );

  sendSuccess(res, 200, 'Notice updated successfully', notice);
};

export const publishNotice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const notice = await Notice.findById(id);
  if (!notice) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notice not found');
  }

  if (
    req.user?.role === 'TEACHER' &&
    notice.authorId.toString() !== req.user.id.toString()
  ) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Teachers can only publish their own notices'
    );
  }

  notice.status = 'PUBLISHED';
  notice.publishDate = new Date();
  await notice.save();

  // Log delivery for author/audit
  await DeliveryLog.create({
    noticeId: notice._id,
    recipientId: req.user?.id,
    channel: 'IN_APP',
    status: 'DELIVERED',
    deliveredAt: new Date(),
  });

  sendSuccess(res, 200, 'Notice published successfully', notice);
};

export const archiveNotice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const notice = await Notice.findById(id);
  if (!notice) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notice not found');
  }

  if (
    req.user?.role === 'TEACHER' &&
    notice.authorId.toString() !== req.user.id.toString()
  ) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Teachers can only archive their own notices'
    );
  }

  notice.status = 'ARCHIVED';
  await notice.save();

  sendSuccess(res, 200, 'Notice archived successfully', notice);
};

export const deleteNotice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const notice = await Notice.findById(id);
  if (!notice) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Notice not found');
  }

  if (
    req.user?.role === 'TEACHER' &&
    notice.authorId.toString() !== req.user.id.toString()
  ) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'Teachers can only delete their own notices'
    );
  }

  await Notice.findByIdAndDelete(id);

  sendSuccess(res, 200, 'Notice deleted successfully', { id });
};
