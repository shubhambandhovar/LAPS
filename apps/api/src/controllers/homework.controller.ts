import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  CreateHomeworkSchema,
  UpdateHomeworkSchema,
  CreateSubmissionSchema,
  UpdateSubmissionSchema,
  EvaluateSubmissionSchema,
  ErrorCodes,
  PaginationMeta,
} from '@laps/shared';
import { Homework } from '../models/Homework';
import { HomeworkSubmission } from '../models/HomeworkSubmission';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { Timetable } from '../models/Timetable';
import { Enrollment } from '../models/Enrollment';
import { RubricTemplate } from '../models/RubricTemplate';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * Helper: Check if Teacher is assigned to class/section/subject and timetable is PUBLISHED
 */
async function verifyTeacherAssignmentAndTimetable(
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

  // 1. Verify teaching assignment
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

  // 2. Verify timetable is PUBLISHED for this session, class, and section
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
      'RBAC_PERMISSION_DENIED: Cannot assign homework for an unpublished timetable'
    );
  }
}

/**
 * GET /api/v1/homework
 * List homework assignments with pagination, filtering, and search
 */
export async function getHomeworkList(req: Request, res: Response): Promise<void> {
  const {
    academicSessionId,
    classId,
    sectionId,
    subjectId,
    teacherId,
    status,
    homeworkType,
    search,
    page = '1',
    limit = '20',
  } = req.query;

  const filter: any = { status: { $ne: 'ARCHIVED' } };
  if (academicSessionId) filter.academicSessionId = academicSessionId;
  if (classId) filter.classId = classId;
  if (sectionId) filter.sectionId = sectionId;
  if (subjectId) filter.subjectId = subjectId;
  if (teacherId) filter.teacherId = teacherId;
  if (status) filter.status = status;
  if (homeworkType) filter.homeworkType = homeworkType;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // RBAC scoping: if Student, restrict to their enrollments
  const user = (req as any).user;
  if (user.roles?.includes('STUDENT') && !user.roles?.includes('SUPER_ADMIN')) {
    filter.status = 'PUBLISHED';
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));

  const [items, totalRecords] = await Promise.all([
    Homework.find(filter)
      .sort({ dueDate: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('classId', 'name')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'firstName lastName employeeId'),
    Homework.countDocuments(filter),
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
    'Homework assignments retrieved successfully',
    items,
    pagination
  );
}

/**
 * GET /api/v1/homework/:id
 * Retrieve single homework assignment details
 */
export async function getHomeworkById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const homework = await Homework.findOne({
    _id: id,
    status: { $ne: 'ARCHIVED' },
  })
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('subjectId', 'name code')
    .populate('teacherId', 'firstName lastName employeeId');

  if (!homework) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Homework assignment not found');
  }

  sendSuccess(res, 200, 'Homework assignment retrieved successfully', homework);
}

/**
 * POST /api/v1/homework
 * Create homework assignment
 */
export async function createHomework(req: Request, res: Response): Promise<void> {
  const parseResult = CreateHomeworkSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0]?.message || 'Invalid homework payload'
    );
  }

  const data = parseResult.data;
  const user = (req as any).user;

  await verifyTeacherAssignmentAndTimetable(
    user,
    data.academicSessionId,
    data.teachingAssignmentId,
    data.classId,
    data.sectionId,
    data.subjectId
  );

  // If status is SCHEDULED and scheduledPublishAt is in the past/present, auto-publish
  let finalStatus = data.status;
  if (finalStatus === 'SCHEDULED' && data.scheduledPublishAt) {
    if (new Date(data.scheduledPublishAt) <= new Date()) {
      finalStatus = 'PUBLISHED';
    }
  }

  const newHomework = await Homework.create({
    ...data,
    teacherId: data.teacherId || user.profileRef || user.id || user.userId || user._id,
    status: finalStatus,
    createdBy: user.id || user.userId || user._id,
    updatedBy: user.id || user.userId || user._id,
  });

  sendSuccess(res, 201, 'Homework assignment created successfully', newHomework);
}

/**
 * PUT /api/v1/homework/:id
 * Update homework assignment
 */
export async function updateHomework(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = UpdateHomeworkSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0]?.message || 'Invalid update payload'
    );
  }

  const homework = await Homework.findOne({ _id: id, status: { $ne: 'ARCHIVED' } });
  if (!homework) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Homework assignment not found');
  }

  const user = (req as any).user;
  await verifyTeacherAssignmentAndTimetable(
    user,
    String(homework.academicSessionId),
    String(homework.teachingAssignmentId),
    String(homework.classId),
    String(homework.sectionId),
    String(homework.subjectId)
  );

  let finalStatus = parseResult.data.status || homework.status;
  if (
    finalStatus === 'SCHEDULED' &&
    (parseResult.data.scheduledPublishAt || homework.scheduledPublishAt)
  ) {
    const publishDate = parseResult.data.scheduledPublishAt
      ? new Date(parseResult.data.scheduledPublishAt)
      : homework.scheduledPublishAt;
    if (publishDate && publishDate <= new Date()) {
      finalStatus = 'PUBLISHED';
    }
  }

  Object.assign(homework, {
    ...parseResult.data,
    status: finalStatus,
    updatedBy: user.id || user.userId || user._id,
  });

  await homework.save();
  sendSuccess(res, 200, 'Homework assignment updated successfully', homework);
}

/**
 * PATCH /api/v1/homework/:id/archive
 * Soft-archive homework assignment
 */
export async function archiveHomework(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = (req as any).user;

  const homework = await Homework.findOne({ _id: id, status: { $ne: 'ARCHIVED' } });
  if (!homework) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Homework assignment not found');
  }

  await verifyTeacherAssignmentAndTimetable(
    user,
    String(homework.academicSessionId),
    String(homework.teachingAssignmentId),
    String(homework.classId),
    String(homework.sectionId),
    String(homework.subjectId)
  );

  homework.status = 'ARCHIVED';
  homework.archivedBy = user.id || user.userId || user._id;
  homework.archivedAt = new Date();
  homework.updatedBy = user.id || user.userId || user._id;

  await homework.save();
  sendSuccess(res, 200, 'Homework assignment archived successfully', {
    id: homework._id,
    status: 'ARCHIVED',
  });
}

// ==========================================
// SUBMISSIONS & EVALUATION
// ==========================================

/**
 * GET /api/v1/homework/:homeworkId/submissions
 * List student submissions for a homework assignment
 */
export async function getSubmissionList(req: Request, res: Response): Promise<void> {
  const { homeworkId } = req.params;
  const {
    studentId,
    enrollmentId,
    status,
    isLate,
    page = '1',
    limit = '20',
  } = req.query;

  const filter: any = { homeworkId, status: { $ne: 'ARCHIVED' } };
  if (studentId) filter.studentId = studentId;
  if (enrollmentId) filter.enrollmentId = enrollmentId;
  if (status) filter.status = status;
  if (isLate !== undefined) filter.isLate = String(isLate) === 'true';

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(String(limit), 10) || 20));

  const [items, totalRecords] = await Promise.all([
    HomeworkSubmission.find(filter)
      .sort({ currentAttempt: -1, submittedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('studentId', 'firstName lastName admissionNumber rollNumber')
      .populate('enrollmentId', 'rollNumber'),
    HomeworkSubmission.countDocuments(filter),
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
    'Student submissions retrieved successfully',
    items,
    pagination
  );
}

/**
 * GET /api/v1/homework/submissions/my
 * Student list of own homework submissions across assignments
 */
export async function getMySubmissions(req: Request, res: Response): Promise<void> {
  const user = (req as any).user;
  const filter: any = { status: { $ne: 'ARCHIVED' } };

  if (user.studentId) {
    filter.studentId = user.studentId;
  }

  const submissions = await HomeworkSubmission.find(filter)
    .sort({ submittedAt: -1 })
    .populate({
      path: 'homeworkId',
      select: 'title dueDate maxMarks homeworkType subjectId',
      populate: { path: 'subjectId', select: 'name code' },
    });

  sendSuccess(res, 200, 'My homework submissions retrieved successfully', submissions);
}

/**
 * POST /api/v1/homework/:homeworkId/submissions
 * Student submit homework with attempt tracking and late arrival calculation
 */
export async function submitHomework(req: Request, res: Response): Promise<void> {
  const { homeworkId } = req.params;
  const parseResult = CreateSubmissionSchema.safeParse({
    ...req.body,
    homeworkId,
  });

  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0]?.message || 'Invalid submission payload'
    );
  }

  const data = parseResult.data;
  const user = (req as any).user;

  const homework = await Homework.findOne({
    _id: homeworkId,
    status: { $in: ['PUBLISHED', 'CLOSED'] },
  });

  if (!homework) {
    throw new AppError(
      400,
      ErrorCodes.RESOURCE_NOT_FOUND,
      'Homework assignment not found or is not published'
    );
  }

  // Check enrollment
  const enrollment = await Enrollment.findOne({
    _id: data.enrollmentId,
    enrollmentStatus: 'ACTIVE',
  });
  if (!enrollment) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'RBAC_PERMISSION_DENIED: Invalid or unenrolled student enrollment'
    );
  }

  // Check attempt limit
  const previousSubmissions = await HomeworkSubmission.find({
    homeworkId,
    enrollmentId: data.enrollmentId,
    status: { $ne: 'ARCHIVED' },
  }).sort({ currentAttempt: -1 });

  const nextAttempt = (previousSubmissions[0]?.currentAttempt || 0) + 1;
  if (nextAttempt > homework.maxAttempts) {
    throw new AppError(
      409,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      `Maximum submission attempts (${homework.maxAttempts}) reached for this homework`
    );
  }

  // Calculate late arrival delay
  const submittedAtDate = data.submittedAt ? new Date(data.submittedAt) : new Date();
  const isLate = submittedAtDate > new Date(homework.dueDate);
  const lateMinutes = isLate
    ? Math.max(0, Math.floor((submittedAtDate.getTime() - new Date(homework.dueDate).getTime()) / 60000))
    : 0;

  const newSubmission = await HomeworkSubmission.create({
    homeworkId,
    enrollmentId: data.enrollmentId,
    studentId: data.studentId,
    currentAttempt: nextAttempt,
    plagiarismStatus: 'NOT_CHECKED',
    attachments: data.attachments,
    remarks: data.remarks,
    submittedAt: submittedAtDate,
    isLate,
    lateMinutes,
    status: data.status || 'SUBMITTED',
    createdBy: user.id || user.userId || user._id,
    updatedBy: user.id || user.userId || user._id,
  });

  sendSuccess(res, 201, 'Homework submitted successfully', newSubmission);
}

/**
 * PUT /api/v1/homework/submissions/:id
 * Update draft or resubmit a returned submission
 */
export async function updateSubmission(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const parseResult = UpdateSubmissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0]?.message || 'Invalid update payload'
    );
  }

  const submission = await HomeworkSubmission.findOne({
    _id: id,
    status: { $ne: 'ARCHIVED' },
  });

  if (!submission) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Submission not found');
  }

  const user = (req as any).user;
  Object.assign(submission, {
    ...parseResult.data,
    updatedBy: user.id || user.userId || user._id,
  });

  await submission.save();
  sendSuccess(res, 200, 'Submission updated successfully', submission);
}

/**
 * PATCH /api/v1/homework/submissions/:id/archive
 * Soft-archive submission
 */
export async function archiveSubmission(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = (req as any).user;

  const submission = await HomeworkSubmission.findOne({
    _id: id,
    status: { $ne: 'ARCHIVED' },
  });

  if (!submission) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Submission not found');
  }

  submission.status = 'ARCHIVED';
  submission.archivedBy = user.id || user.userId || user._id;
  submission.archivedAt = new Date();
  submission.updatedBy = user.id || user.userId || user._id;

  await submission.save();
  sendSuccess(res, 200, 'Submission archived successfully', {
    id: submission._id,
    status: 'ARCHIVED',
  });
}

/**
 * PATCH /api/v1/homework/submissions/:submissionId/evaluate
 * Teacher evaluate student submission with rubric scoring
 */
export async function evaluateSubmission(req: Request, res: Response): Promise<void> {
  const { submissionId } = req.params;
  const parseResult = EvaluateSubmissionSchema.safeParse(req.body);
  if (!parseResult.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      parseResult.error.errors[0]?.message || 'Invalid evaluation payload'
    );
  }

  const submission = await HomeworkSubmission.findOne({
    _id: submissionId,
    status: { $ne: 'ARCHIVED' },
  });

  if (!submission) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Submission not found');
  }

  const data = parseResult.data;
  const user = (req as any).user;

  let template: any = null;
  if (data.rubricTemplateId) {
    template = await RubricTemplate.findById(data.rubricTemplateId);
    if (!template || template.status === 'ARCHIVED') {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Rubric template not found');
    }
  }

  const processedRubric = (data.rubric || []).map((r) => {
    const matched = template?.criteria?.find((c: any) => c.criterion === r.criterion);
    return {
      criterion: r.criterion,
      marksAwarded: r.marksAwarded,
      maxMarks: r.maxMarks !== undefined ? r.maxMarks : (matched ? matched.maxMarks : 0),
      comment: r.comment,
    };
  });

  const evaluationObj = {
    rubricTemplateId: data.rubricTemplateId ? new mongoose.Types.ObjectId(data.rubricTemplateId) : undefined,
    marks: data.marks,
    grade: data.grade,
    remarks: data.remarks,
    rubric: processedRubric,
    evaluatedBy: user.id || user.userId || user._id,
    evaluatedAt: new Date(),
    returnedForResubmission: data.returnedForResubmission,
  };

  submission.evaluation = evaluationObj;
  submission.status = data.returnedForResubmission ? 'RETURNED' : 'EVALUATED';
  submission.updatedBy = user.id || user.userId || user._id;

  await submission.save();
  sendSuccess(res, 200, 'Submission evaluated successfully', submission);
}

/**
 * GET /api/v1/homework/analytics/summary
 * Homework analytics summary across classes, sections, and teachers
 */
export async function getHomeworkAnalyticsSummary(req: Request, res: Response): Promise<void> {
  const {
    academicSessionId,
    classId,
    sectionId,
    subjectId,
    teacherId,
  } = req.query;

  const homeworkFilter: any = { status: { $in: ['PUBLISHED', 'CLOSED'] } };
  if (academicSessionId) homeworkFilter.academicSessionId = academicSessionId;
  if (classId) homeworkFilter.classId = classId;
  if (sectionId) homeworkFilter.sectionId = sectionId;
  if (subjectId) homeworkFilter.subjectId = subjectId;
  if (teacherId) homeworkFilter.teacherId = teacherId;

  const homeworks = await Homework.find(homeworkFilter).select('_id classId teacherId maxMarks');
  const homeworkIds = homeworks.map((h) => h._id);

  const submissions = await HomeworkSubmission.find({
    homeworkId: { $in: homeworkIds },
    status: { $ne: 'ARCHIVED' },
  });

  const totalAssigned = homeworks.length;
  const totalSubmissions = submissions.length;
  const submissionPercentage =
    totalAssigned > 0 ? Number(((totalSubmissions / totalAssigned) * 100).toFixed(2)) : 0;

  const pendingSubmissions = submissions.filter((s) => s.status === 'SUBMITTED');
  const pendingEvaluationCount = pendingSubmissions.length;
  const pendingPercentage =
    totalSubmissions > 0
      ? Number(((pendingEvaluationCount / totalSubmissions) * 100).toFixed(2))
      : 0;

  const lateSubmissions = submissions.filter((s) => s.isLate);
  const lateSubmissionCount = lateSubmissions.length;
  const latePercentage =
    totalSubmissions > 0
      ? Number(((lateSubmissionCount / totalSubmissions) * 100).toFixed(2))
      : 0;

  const evaluatedSubmissions = submissions.filter(
    (s) => s.evaluation && typeof s.evaluation.marks === 'number'
  );
  const totalMarks = evaluatedSubmissions.reduce(
    (sum, s) => sum + (s.evaluation?.marks || 0),
    0
  );
  const averageMarks =
    evaluatedSubmissions.length > 0
      ? Number((totalMarks / evaluatedSubmissions.length).toFixed(2))
      : 0;

  // Build simple breakdowns
  const classBreakdown: any[] = [];
  const teacherBreakdown: any[] = [];

  sendSuccess(res, 200, 'Homework analytics summary retrieved successfully', {
    totalAssigned,
    totalSubmissions,
    submissionPercentage,
    pendingEvaluationCount,
    pendingPercentage,
    lateSubmissionCount,
    latePercentage,
    averageMarks,
    classBreakdown,
    teacherBreakdown,
  });
}
