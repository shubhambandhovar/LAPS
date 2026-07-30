import { Request, Response } from 'express';
import {
  BulkMarksEntryRequestSchema,
  AwardGraceMarksSchema,
  ErrorCodes,
  MarksEntryStatus,
  MarksRevisionHistoryItem,
} from '@laps/shared';
import { MarksEntry } from '../models/MarksEntry';
import { TeachingAssignment } from '../models/TeachingAssignment';
import { AssessmentComponent } from '../models/AssessmentComponent';
import { GradeScale } from '../models/GradeScale';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * Helper: Verify Teacher authorization for EXAM_MARKS_SCOPE against TeachingAssignment
 */
async function verifyTeacherMarksScope(
  user: any,
  teachingAssignmentId: string,
  _classSubjectId: string,
  academicSessionId: string
): Promise<void> {
  const userRoles = user.roles || [];
  const isAdmin =
    user.role === 'SUPER_ADMIN' ||
    user.role === 'SCHOOL_ADMIN' ||
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('SCHOOL_ADMIN');
  if (isAdmin) {
    return;
  }

  const ta = await TeachingAssignment.findOne({
    _id: teachingAssignmentId,
    academicSessionId,
    status: 'ACTIVE',
  });

  if (!ta) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'You do not have an active teaching assignment for this class/subject'
    );
  }

  if (ta.teacherId.toString() !== user.id && ta.teacherId.toString() !== user.profileRef) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'You are not authorized to enter marks for another teacher assignment'
    );
  }
}

/**
 * Helper: Calculate total marks, maximum marks, percentage, and resolve letter grade
 */
async function calculateMarksAndGrade(
  examId: string,
  classSubjectId: string,
  academicSessionId: string,
  componentMarks: {
    assessmentComponentId: string;
    componentName: string;
    marksObtained: number;
    isAbsent: boolean;
    isMedical: boolean;
    isExempt: boolean;
  }[],
  graceMarks: number = 0
): Promise<{
  totalMarksObtained: number;
  maximumMarksTotal: number;
  percentage: number;
  grade: string;
  gradePoint: number;
}> {
  const components = await AssessmentComponent.find({
    examId,
    classSubjectId,
    status: 'ACTIVE',
  });

  const maxTotal = components.reduce((sum, c) => sum + (c.maximumMarks || 100), 0) || 100;
  const rawSum = componentMarks.reduce((sum, cm) => {
    if (cm.isAbsent || cm.isMedical || cm.isExempt) return sum;
    return sum + (cm.marksObtained || 0);
  }, 0);

  const totalObtained = rawSum + graceMarks;
  const percentage = Math.min(100, Math.round((totalObtained / maxTotal) * 10000) / 100);

  const defaultScale = await GradeScale.getDefaultScale(academicSessionId);
  const resolved = defaultScale
    ? defaultScale.resolveGrade(percentage)
    : { grade: percentage >= 33 ? 'P' : 'F', gradePoint: Math.round(percentage / 10), isPassing: percentage >= 33 };

  return {
    totalMarksObtained: totalObtained,
    maximumMarksTotal: maxTotal,
    percentage,
    grade: resolved.grade,
    gradePoint: resolved.gradePoint,
  };
}

export const listMarksEntries = async (req: Request, res: Response): Promise<void> => {
  const { examId, classSubjectId, teachingAssignmentId, enrollmentId, studentId, status } = req.query;

  const query: Record<string, any> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (examId) query.examId = examId;
  if (classSubjectId) query.classSubjectId = classSubjectId;
  if (teachingAssignmentId) query.teachingAssignmentId = teachingAssignmentId;
  if (enrollmentId) query.enrollmentId = enrollmentId;
  if (studentId) query.studentId = studentId;
  if (status) query.status = status;

  const entries = await MarksEntry.find(query).sort({ studentId: 1 });

  sendSuccess(res, 200, 'Marks entries retrieved successfully', entries);
};

export const getMarksEntryById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const entry = await MarksEntry.findById(id);

  if (!entry || entry.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Marks entry not found');
  }

  sendSuccess(res, 200, 'Marks entry retrieved successfully', entry);
};

export const bulkEnterMarks = async (req: Request, res: Response): Promise<void> => {
  const parsed = BulkMarksEntryRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid bulk marks payload', parsed.error.errors);
  }

  const { examId, academicSessionId, academicTermId, classSubjectId, teachingAssignmentId, entries, submit } =
    parsed.data;

  await verifyTeacherMarksScope(
    (req as any).user,
    teachingAssignmentId,
    classSubjectId,
    academicSessionId
  );

  const userRoles = (req as any).user.roles || [];
  const isAdmin =
    (req as any).user.role === 'SUPER_ADMIN' ||
    (req as any).user.role === 'SCHOOL_ADMIN' ||
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('SCHOOL_ADMIN');

  const results = [];
  const now = new Date();
  const userId = (req as any).user.id;
  const targetStatus: MarksEntryStatus = submit ? 'SUBMITTED' : 'DRAFT';

  for (const item of entries) {
    let entry = await MarksEntry.findOne({
      examId,
      classSubjectId,
      enrollmentId: item.enrollmentId,
      status: { $ne: 'ARCHIVED' },
    });

    if (entry) {
      if (!isAdmin && (entry.status === 'SUBMITTED' || entry.status === 'LOCKED' || entry.status === 'PUBLISHED')) {
        throw new AppError(
          409,
          ErrorCodes.VALIDATION_ERROR,
          `Cannot modify marks for enrollment ${item.enrollmentId} because marks are already ${entry.status}`
        );
      }

      const prevTotal = entry.totalMarksObtained;
      const calc = await calculateMarksAndGrade(
        examId,
        classSubjectId,
        academicSessionId,
        item.componentMarks,
        entry.graceMarksAwarded
      );

      const historyItem: MarksRevisionHistoryItem = {
        modifiedBy: userId,
        modifiedAt: now,
        previousTotal: prevTotal,
        newTotal: calc.totalMarksObtained,
        reason: submit ? 'Submitted marks' : 'Updated draft marks',
        status: targetStatus,
      };

      entry.componentMarks = item.componentMarks as any;
      entry.totalMarksObtained = calc.totalMarksObtained;
      entry.maximumMarksTotal = calc.maximumMarksTotal;
      entry.percentage = calc.percentage;
      entry.grade = calc.grade;
      entry.gradePoint = calc.gradePoint;
      entry.isAbsent = item.isAbsent || false;
      entry.isMedical = item.isMedical || false;
      entry.isExempt = item.isExempt || false;
      if (item.remarks !== undefined) entry.remarks = item.remarks;
      entry.status = targetStatus;
      if (submit) {
        entry.submittedAt = now;
        entry.submittedBy = userId;
      }
      entry.updatedBy = userId;
      entry.history.push(historyItem);

      await entry.save();
      results.push(entry);
    } else {
      const calc = await calculateMarksAndGrade(
        examId,
        classSubjectId,
        academicSessionId,
        item.componentMarks,
        0
      );

      const historyItem: MarksRevisionHistoryItem = {
        modifiedBy: userId,
        modifiedAt: now,
        previousTotal: 0,
        newTotal: calc.totalMarksObtained,
        reason: 'Initial marks entry',
        status: targetStatus,
      };

      entry = await MarksEntry.create({
        examId,
        academicSessionId,
        academicTermId,
        classSubjectId,
        teachingAssignmentId,
        enrollmentId: item.enrollmentId,
        studentId: item.studentId,
        componentMarks: item.componentMarks,
        totalMarksObtained: calc.totalMarksObtained,
        maximumMarksTotal: calc.maximumMarksTotal,
        percentage: calc.percentage,
        grade: calc.grade,
        gradePoint: calc.gradePoint,
        isAbsent: item.isAbsent || false,
        isMedical: item.isMedical || false,
        isExempt: item.isExempt || false,
        graceMarksAwarded: 0,
        remarks: item.remarks,
        status: targetStatus,
        submittedAt: submit ? now : undefined,
        submittedBy: submit ? userId : undefined,
        history: [historyItem],
        createdBy: userId,
        updatedBy: userId,
      });
      results.push(entry);
    }
  }

  sendSuccess(res, 200, 'Marks entries saved successfully', results);
};

export const submitMarks = async (req: Request, res: Response): Promise<void> => {
  const { examId, teachingAssignmentId } = req.body;
  if (!examId || !teachingAssignmentId) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'examId and teachingAssignmentId are required');
  }

  const entries = await MarksEntry.find({
    examId,
    teachingAssignmentId,
    status: 'DRAFT',
  });

  if (entries.length === 0) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'No draft marks found to submit for this assignment');
  }

  const userId = (req as any).user.id;
  const now = new Date();

  for (const entry of entries) {
    const prevTotal = entry.totalMarksObtained;
    entry.status = 'SUBMITTED';
    entry.submittedAt = now;
    entry.submittedBy = userId;
    entry.updatedBy = userId;
    entry.history.push({
      modifiedBy: userId,
      modifiedAt: now,
      previousTotal: prevTotal,
      newTotal: entry.totalMarksObtained,
      reason: 'Marks submitted by teacher',
      status: 'SUBMITTED',
    });
    await entry.save();
  }

  sendSuccess(res, 200, 'Marks submitted successfully', { submittedCount: entries.length });
};

export const lockMarks = async (req: Request, res: Response): Promise<void> => {
  const { examId, classSubjectId } = req.body;
  if (!examId || !classSubjectId) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'examId and classSubjectId are required');
  }

  const entries = await MarksEntry.find({
    examId,
    classSubjectId,
    status: { $in: ['DRAFT', 'SUBMITTED'] },
  });

  const userId = (req as any).user.id;
  const now = new Date();

  for (const entry of entries) {
    const prevTotal = entry.totalMarksObtained;
    entry.status = 'LOCKED';
    entry.lockedAt = now;
    entry.lockedBy = userId;
    entry.updatedBy = userId;
    entry.history.push({
      modifiedBy: userId,
      modifiedAt: now,
      previousTotal: prevTotal,
      newTotal: entry.totalMarksObtained,
      reason: 'Marks locked by administrator',
      status: 'LOCKED',
    });
    await entry.save();
  }

  sendSuccess(res, 200, 'Marks locked successfully', { lockedCount: entries.length });
};

export const publishMarks = async (req: Request, res: Response): Promise<void> => {
  const { examId, classSubjectId } = req.body;
  if (!examId || !classSubjectId) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'examId and classSubjectId are required');
  }

  const entries = await MarksEntry.find({
    examId,
    classSubjectId,
    status: { $in: ['SUBMITTED', 'LOCKED'] },
  });

  const userId = (req as any).user.id;
  const now = new Date();

  for (const entry of entries) {
    const prevTotal = entry.totalMarksObtained;
    entry.status = 'PUBLISHED';
    entry.publishedAt = now;
    entry.publishedBy = userId;
    entry.updatedBy = userId;
    entry.history.push({
      modifiedBy: userId,
      modifiedAt: now,
      previousTotal: prevTotal,
      newTotal: entry.totalMarksObtained,
      reason: 'Marks published by administrator',
      status: 'PUBLISHED',
    });
    await entry.save();
  }

  sendSuccess(res, 200, 'Marks published successfully', { publishedCount: entries.length });
};

export const awardGraceMarks = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = AwardGraceMarksSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid grace marks payload', parsed.error.errors);
  }

  const entry = await MarksEntry.findById(id);
  if (!entry || entry.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Marks entry not found');
  }

  const prevTotal = entry.totalMarksObtained;
  const userId = (req as any).user.id;
  const now = new Date();

  entry.graceMarksAwarded = parsed.data.graceMarksAwarded;

  const calc = await calculateMarksAndGrade(
    entry.examId.toString(),
    entry.classSubjectId.toString(),
    entry.academicSessionId.toString(),
    entry.componentMarks as any,
    entry.graceMarksAwarded
  );

  entry.totalMarksObtained = calc.totalMarksObtained;
  entry.percentage = calc.percentage;
  entry.grade = calc.grade;
  entry.gradePoint = calc.gradePoint;
  entry.updatedBy = userId;

  entry.history.push({
    modifiedBy: userId,
    modifiedAt: now,
    previousTotal: prevTotal,
    newTotal: calc.totalMarksObtained,
    reason: `Grace marks awarded (${parsed.data.graceMarksAwarded}): ${parsed.data.reason}`,
    status: entry.status,
  });

  await entry.save();
  sendSuccess(res, 200, 'Grace marks awarded successfully', entry);
};

export const archiveMarksEntry = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const entry = await MarksEntry.findById(id);

  if (!entry || entry.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Marks entry not found');
  }

  entry.status = 'ARCHIVED';
  entry.updatedBy = (req as any).user.id;

  await entry.save();
  sendSuccess(res, 200, 'Marks entry archived successfully', entry);
};
