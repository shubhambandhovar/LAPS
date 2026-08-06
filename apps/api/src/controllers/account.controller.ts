import { Request, Response } from 'express';
import {
  generateAccountSchema,
  generateBulkAccountSchema,
  resetPasswordSchema,
  regenerateUsernameSchema,
  updateAccountStatusSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { User, LoginHistory, Student, Teacher, Employee } from '../models';
import { IdentityAutomationService } from '../services/identityAutomation.service';
import { sendSuccess } from '../utils/response';
import { AppError } from '../utils/errors';
import { logger } from '../config/logger';

export async function generateAccountController(
  req: Request,
  res: Response,
): Promise<void> {
  const { entityType, entityId, sendNotification } = generateAccountSchema.parse(req.body);

  let result;
  if (entityType === 'STUDENT') {
    result = await IdentityAutomationService.generateStudentAccount(
      entityId,
      undefined,
      'LAPS-GOHAD',
      sendNotification,
    );
  } else if (entityType === 'TEACHER') {
    result = await IdentityAutomationService.generateTeacherAccount(
      entityId,
      'LAPS-GOHAD',
      sendNotification,
    );
  } else if (entityType === 'EMPLOYEE') {
    result = await IdentityAutomationService.generateEmployeeAccount(
      entityId,
      undefined,
      undefined,
      'LAPS-GOHAD',
      sendNotification,
    );
  } else {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, `Unsupported entityType: ${entityType}`);
  }

  sendSuccess(res, 201, 'Account generated successfully', {
    user: result.user,
    temporaryPasswordSent: true,
  });
}

export async function generateBulkAccountController(
  req: Request,
  res: Response,
): Promise<void> {
  const { entityType, entityIds, sendNotification } = generateBulkAccountSchema.parse(req.body);

  let targetIds: string[] = entityIds || [];

  if (targetIds.length === 0) {
    if (entityType === 'STUDENT') {
      const students = await Student.find({ status: 'ACTIVE', userId: { $exists: false } }).select('_id');
      targetIds = students.map((s) => s._id.toString());
    } else if (entityType === 'TEACHER') {
      const teachers = await Teacher.find({ status: 'ACTIVE', userId: { $exists: false } }).select('_id');
      targetIds = teachers.map((t) => t._id.toString());
    } else if (entityType === 'EMPLOYEE') {
      const employees = await Employee.find({ status: 'ACTIVE', userId: { $exists: false } }).select('_id');
      targetIds = employees.map((e) => e._id.toString());
    }
  }

  const generated: any[] = [];
  const errors: any[] = [];

  for (const id of targetIds) {
    try {
      let result;
      if (entityType === 'STUDENT') {
        result = await IdentityAutomationService.generateStudentAccount(
          id,
          undefined,
          'LAPS-GOHAD',
          sendNotification,
        );
      } else if (entityType === 'TEACHER') {
        result = await IdentityAutomationService.generateTeacherAccount(
          id,
          'LAPS-GOHAD',
          sendNotification,
        );
      } else if (entityType === 'EMPLOYEE') {
        result = await IdentityAutomationService.generateEmployeeAccount(
          id,
          undefined,
          undefined,
          'LAPS-GOHAD',
          sendNotification,
        );
      }
      if (result) {
        generated.push({ id, identifier: result.user.identifier });
      }
    } catch (err: any) {
      errors.push({ id, message: err.message || 'Failed to generate account' });
    }
  }

  sendSuccess(res, 200, 'Bulk account generation finished', {
    totalTargeted: targetIds.length,
    successCount: generated.length,
    failureCount: errors.length,
    generated,
    errors,
  });
}

export async function resetPasswordController(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId, sendNotification } = resetPasswordSchema.parse(req.body);

  await IdentityAutomationService.resetPassword(userId, sendNotification ?? true);

  sendSuccess(res, 200, 'Password reset successfully. A temporary password notification has been sent.', { ok: true });
}

export async function regenerateUsernameController(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId, customUsername } = regenerateUsernameSchema.parse(req.body);

  const updatedUser = await IdentityAutomationService.regenerateUsername(userId, customUsername);

  sendSuccess(res, 200, 'Username regenerated successfully', updatedUser);
}

export async function updateAccountStatusController(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId, status, reason } = updateAccountStatusSchema.parse(req.body);

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'User account not found');
  }

  user.status = status as any;
  if (status === 'ACTIVE') {
    user.lockedUntil = undefined;
    user.failedLoginAttempts = 0;
  }
  await user.save();

  logger.info({ userId, status, reason, adminId: req.user?.id }, 'AUDIT: Account status updated');

  sendSuccess(res, 200, 'Account status updated successfully', {
    id: user._id,
    identifier: user.identifier,
    status: user.status,
  });
}

export async function listAccountsController(
  req: Request,
  res: Response,
): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { schoolId: 'LAPS-GOHAD' };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.userType) filter.userType = req.query.userType;
  if (req.query.role) filter.roleCode = req.query.role;
  if (req.query.search) {
    const searchRegex = new RegExp(String(req.query.search), 'i');
    filter.$or = [
      { identifier: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  const meta: PaginationMeta = {
    totalRecords: total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  sendSuccess(res, 200, 'Accounts retrieved successfully', items, meta);
}

export async function getAccountByIdController(
  req: Request,
  res: Response,
): Promise<void> {
  const user = await User.findById(req.params.id).select('-passwordHash');
  if (!user) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Account not found');
  }
  sendSuccess(res, 200, 'Account retrieved successfully', user);
}

export async function getLoginHistoryController(
  req: Request,
  res: Response,
): Promise<void> {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { schoolId: 'LAPS-GOHAD' };
  if (req.query.userId) filter.userId = req.query.userId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.identifier) {
    filter.identifier = new RegExp(String(req.query.identifier), 'i');
  }

  const [items, total] = await Promise.all([
    LoginHistory.find(filter)
      .sort({ loginAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LoginHistory.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  const meta: PaginationMeta = {
    totalRecords: total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };

  sendSuccess(res, 200, 'Login history retrieved successfully', items, meta);
}
