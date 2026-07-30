import { Request, Response } from 'express';
import {
  CalculateResultRequestSchema,
  PublishResultRequestSchema,
  ErrorCodes,
  ResultStatus,
  TopPerformerSummaryItem,
} from '@laps/shared';
import { Result } from '../models/Result';
import { MarksEntry } from '../models/MarksEntry';
import { Enrollment } from '../models/Enrollment';
import { ClassSubject } from '../models/ClassSubject';
import { Subject } from '../models/Subject';
import { Student } from '../models/Student';
import { Exam } from '../models/Exam';
import { GradeScale } from '../models/GradeScale';
import { ExamAnalyticsSummary } from '../models/ExamAnalyticsSummary';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * Helper: Update Materialized Summary Cache for an Exam and Class
 */
async function updateExamAnalyticsCache(
  examId: string,
  classId: string,
  academicSessionId: string,
  sectionId?: string
): Promise<void> {
  const query: Record<string, any> = {
    examId,
    classId,
    status: { $ne: 'ARCHIVED' },
  };
  if (sectionId) query.sectionId = sectionId;

  const results = await Result.find(query).sort({ overallPercentage: -1 });

  const totalStudents = results.length;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalCompartment = 0;
  let totalAbsent = 0;
  let sumPercentage = 0;
  let sumMarks = 0;
  let highestMarks = 0;
  let lowestMarks = totalStudents > 0 ? 100000 : 0;
  const gradeDistribution: Record<string, number> = {};
  const topPerformers: TopPerformerSummaryItem[] = [];

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    if (res.resultStatus === 'PASS') totalPassed++;
    else if (res.resultStatus === 'FAIL') totalFailed++;
    else if (res.resultStatus === 'COMPARTMENT') totalCompartment++;

    sumPercentage += res.overallPercentage || 0;
    sumMarks += res.overallTotalObtained || 0;

    if (res.overallTotalObtained > highestMarks) highestMarks = res.overallTotalObtained;
    if (res.overallTotalObtained < lowestMarks) lowestMarks = res.overallTotalObtained;

    const g = res.overallGrade || 'N/A';
    gradeDistribution[g] = (gradeDistribution[g] || 0) + 1;

    if (i < 10) {
      const student = await Student.findById(res.studentId);
      const enrollment = await Enrollment.findById(res.enrollmentId);
      topPerformers.push({
        enrollmentId: res.enrollmentId.toString(),
        studentId: res.studentId.toString(),
        studentName: student ? `${student.firstName} ${student.lastName}`.trim() : 'Student',
        rollNumber: enrollment?.rollNumber ? String(enrollment.rollNumber) : '',
        totalObtained: res.overallTotalObtained,
        percentage: res.overallPercentage,
        rank: res.rankInClass || i + 1,
      });
    }
  }

  const passPercentage = totalStudents > 0 ? Math.round((totalPassed / totalStudents) * 10000) / 100 : 0;
  const averagePercentage = totalStudents > 0 ? Math.round((sumPercentage / totalStudents) * 100) / 100 : 0;
  const averageMarks = totalStudents > 0 ? Math.round((sumMarks / totalStudents) * 100) / 100 : 0;
  if (totalStudents === 0) lowestMarks = 0;

  await ExamAnalyticsSummary.findOneAndUpdate(
    { academicSessionId, examId, classId, sectionId: sectionId || undefined },
    {
      $set: {
        academicSessionId,
        examId,
        classId,
        sectionId: sectionId || undefined,
        totalStudents,
        totalPassed,
        totalFailed,
        totalCompartment,
        totalAbsent,
        passPercentage,
        averagePercentage,
        averageMarks,
        highestMarks,
        lowestMarks,
        gradeDistribution,
        topPerformers,
        lastCalculatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
}

export const listResults = async (req: Request, res: Response): Promise<void> => {
  const { examId, classId, sectionId, enrollmentId, studentId, status } = req.query;

  const query: Record<string, any> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (examId) query.examId = examId;
  if (classId) query.classId = classId;
  if (sectionId) query.sectionId = sectionId;
  if (enrollmentId) query.enrollmentId = enrollmentId;
  if (studentId) query.studentId = studentId;
  if (status) query.status = status;

  const results = await Result.find(query).sort({ rankInClass: 1 });

  sendSuccess(res, 200, 'Results retrieved successfully', results);
};

export const getMyResults = async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const userRoles = user.roles || [];
  const query: Record<string, any> = {
    status: 'PUBLISHED',
  };

  if (user.role === 'STUDENT' || userRoles.includes('STUDENT')) {
    query.studentId = user.profileRef || user.userId || user.id;
  } else if (user.role === 'GUARDIAN' || userRoles.includes('GUARDIAN')) {
    const { studentId } = req.query;
    if (studentId) query.studentId = studentId;
  }

  const results = await Result.find(query).sort({ createdAt: -1 });

  sendSuccess(res, 200, 'My results retrieved successfully', results);
};

export const getResultById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = await Result.findById(id);

  if (!result || result.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Exam result not found');
  }

  const user = (req as any).user;
  const userRoles = user.roles || [];
  const isAdmin =
    user.role === 'SUPER_ADMIN' ||
    user.role === 'SCHOOL_ADMIN' ||
    userRoles.includes('SUPER_ADMIN') ||
    userRoles.includes('SCHOOL_ADMIN') ||
    user.role === 'TEACHER' ||
    userRoles.includes('TEACHER');

  if (!isAdmin && result.status !== 'PUBLISHED') {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'This examination result is not yet published'
    );
  }

  sendSuccess(res, 200, 'Result retrieved successfully', result);
};

export const calculateResults = async (req: Request, res: Response): Promise<void> => {
  const parsed = CalculateResultRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid calculate result payload', parsed.error.errors);
  }

  const { examId, classId, sectionId } = parsed.data;

  const exam = await Exam.findById(examId);
  if (!exam) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Examination not found');
  }

  const enrollmentsQuery: Record<string, any> = {
    classId,
    academicSessionId: exam.academicSessionId,
    enrollmentStatus: 'ACTIVE',
  };
  if (sectionId) enrollmentsQuery.sectionId = sectionId;

  const enrollments = await Enrollment.find(enrollmentsQuery);
  if (enrollments.length === 0) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'No active enrollments found for this class/section');
  }

  const defaultScale = await GradeScale.getDefaultScale(exam.academicSessionId.toString());
  const userId = (req as any).user.id;
  const now = new Date();
  const calculatedResults = [];

  for (const enrollment of enrollments) {
    const marksEntries = await MarksEntry.find({
      examId,
      enrollmentId: enrollment._id,
      status: { $ne: 'ARCHIVED' },
    });

    const subjectResults = [];
    let overallTotalObtained = 0;
    let overallMaximumMarks = 0;
    let failedSubjectsCount = 0;
    let totalGradePoints = 0;
    const graceRulesApplied = [];

    for (const entry of marksEntries) {
      const classSubject = await ClassSubject.findById(entry.classSubjectId);
      const subject = classSubject ? await Subject.findById(classSubject.subjectId) : null;

      const isPassed = !entry.isAbsent && entry.percentage >= 33;
      if (!isPassed && !entry.isExempt) {
        failedSubjectsCount++;
      }

      subjectResults.push({
        classSubjectId: entry.classSubjectId,
        subjectId: subject ? subject._id : entry.classSubjectId,
        subjectName: subject ? subject.name : 'Unknown Subject',
        subjectCode: subject ? subject.code : 'SUB',
        marksEntryId: entry._id,
        totalMarksObtained: entry.totalMarksObtained,
        maximumMarks: entry.maximumMarksTotal,
        passingMarks: 33,
        percentage: entry.percentage,
        grade: entry.grade,
        gradePoint: entry.gradePoint,
        isPassed,
        isAbsent: entry.isAbsent,
        isExempt: entry.isExempt,
        graceMarks: entry.graceMarksAwarded,
      });

      overallTotalObtained += entry.totalMarksObtained;
      overallMaximumMarks += entry.maximumMarksTotal;
      totalGradePoints += entry.gradePoint || 0;

      if (entry.graceMarksAwarded > 0) {
        graceRulesApplied.push({
          subjectId: subject ? subject._id.toString() : entry.classSubjectId.toString(),
          graceMarksAwarded: entry.graceMarksAwarded,
          ruleReason: 'Grace marks awarded by administrator',
        });
      }
    }

    const overallPercentage =
      overallMaximumMarks > 0
        ? Math.min(100, Math.round((overallTotalObtained / overallMaximumMarks) * 10000) / 100)
        : 0;

    const overallGradePoint =
      subjectResults.length > 0 ? Math.round((totalGradePoints / subjectResults.length) * 100) / 100 : 0;

    const scaleResolved = defaultScale
      ? defaultScale.resolveGrade(overallPercentage)
      : { grade: overallPercentage >= 33 ? 'P' : 'F', gradePoint: Math.round(overallPercentage / 10), isPassing: overallPercentage >= 33 };

    let resultStatus: ResultStatus = 'PASS';
    if (failedSubjectsCount > 2) resultStatus = 'FAIL';
    else if (failedSubjectsCount > 0) resultStatus = 'COMPARTMENT';

    let resultDoc = await Result.findOne({
      examId,
      enrollmentId: enrollment._id,
      status: { $ne: 'ARCHIVED' },
    });

    if (resultDoc) {
      resultDoc.subjectResults = subjectResults as any;
      resultDoc.overallTotalObtained = overallTotalObtained;
      resultDoc.overallMaximumMarks = overallMaximumMarks;
      resultDoc.overallPercentage = overallPercentage;
      resultDoc.overallGrade = scaleResolved.grade;
      resultDoc.overallGradePoint = overallGradePoint;
      resultDoc.resultStatus = resultStatus;
      resultDoc.graceRulesApplied = graceRulesApplied;
      resultDoc.status = 'CALCULATED';
      resultDoc.calculatedAt = now;
      resultDoc.calculatedBy = userId;
      resultDoc.updatedBy = userId;
      await resultDoc.save();
    } else {
      resultDoc = await Result.create({
        examId,
        academicSessionId: exam.academicSessionId,
        academicTermId: exam.academicTermId,
        enrollmentId: enrollment._id,
        studentId: enrollment.studentId,
        classId,
        sectionId: enrollment.sectionId,
        subjectResults,
        overallTotalObtained,
        overallMaximumMarks,
        overallPercentage,
        overallGrade: scaleResolved.grade,
        overallGradePoint: overallGradePoint,
        resultStatus,
        graceRulesApplied,
        status: 'CALCULATED',
        calculatedAt: now,
        calculatedBy: userId,
        createdBy: userId,
        updatedBy: userId,
      });
    }
    calculatedResults.push(resultDoc);
  }

  calculatedResults.sort((a, b) => b.overallPercentage - a.overallPercentage);
  for (let idx = 0; idx < calculatedResults.length; idx++) {
    calculatedResults[idx].rankInClass = idx + 1;
    await calculatedResults[idx].save();
  }

  await updateExamAnalyticsCache(
    examId,
    classId,
    exam.academicSessionId.toString(),
    sectionId
  );

  sendSuccess(res, 200, 'Results calculated successfully', calculatedResults);
};

export const publishResults = async (req: Request, res: Response): Promise<void> => {
  const parsed = PublishResultRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid publish result payload', parsed.error.errors);
  }

  const { examId, classId, sectionId } = parsed.data;
  const query: Record<string, any> = {
    examId,
    classId,
    status: { $in: ['CALCULATED', 'LOCKED'] },
  };
  if (sectionId) query.sectionId = sectionId;

  const results = await Result.find(query);
  if (results.length === 0) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'No calculated results found to publish');
  }

  const userId = (req as any).user.id;
  const now = new Date();

  for (const resDoc of results) {
    resDoc.status = 'PUBLISHED';
    resDoc.publishedAt = now;
    resDoc.publishedBy = userId;
    resDoc.updatedBy = userId;
    await resDoc.save();
  }

  sendSuccess(res, 200, 'Results published successfully', { publishedCount: results.length });
};

export const getAnalyticsSummary = async (req: Request, res: Response): Promise<void> => {
  const { examId, classId, sectionId } = req.query;
  if (!examId || !classId) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'examId and classId are required');
  }

  const query: Record<string, any> = {
    examId,
    classId,
  };
  if (sectionId) query.sectionId = sectionId;

  let summary = await ExamAnalyticsSummary.findOne(query);

  if (!summary) {
    const exam = await Exam.findById(examId);
    if (!exam) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Examination not found');
    }
    await updateExamAnalyticsCache(
      examId as string,
      classId as string,
      exam.academicSessionId.toString(),
      sectionId as string
    );
    summary = await ExamAnalyticsSummary.findOne(query);
  }

  if (!summary) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Analytics summary could not be generated');
  }

  sendSuccess(res, 200, 'Analytics summary retrieved successfully', summary);
};

export const archiveResult = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const result = await Result.findById(id);

  if (!result || result.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Exam result not found');
  }

  result.status = 'ARCHIVED';
  result.updatedBy = (req as any).user.id;

  await result.save();
  sendSuccess(res, 200, 'Result archived successfully', result);
};
