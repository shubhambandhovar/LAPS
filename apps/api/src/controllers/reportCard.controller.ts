import { Request, Response } from 'express';
import {
  GenerateReportCardSchema,
  PublishReportCardsSchema,
  UpdateReportCardRemarksSchema,
  ErrorCodes,
  ReportCardSubjectSummary,
  AttendanceSummary,
  MeritRanking,
} from '@laps/shared';
import { ReportCard } from '../models/ReportCard';
import { ReportCardTemplate } from '../models/ReportCardTemplate';
import { ReportCardVersion } from '../models/ReportCardVersion';
import { Result } from '../models/Result';
import { AttendanceEntry } from '../models/AttendanceEntry';
import { Attendance } from '../models/Attendance';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listReportCards = async (req: Request, res: Response): Promise<void> => {
  const {
    academicSessionId,
    academicTermId,
    examId,
    classId,
    sectionId,
    studentId,
    enrollmentId,
    status,
    assignedClassIds,
  } = req.query;

  const query: Record<string, any> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (academicTermId) query.academicTermId = academicTermId;
  if (examId) query.examId = examId;
  if (classId) query.classId = classId;
  if (sectionId) query.sectionId = sectionId;
  if (studentId) query.studentId = studentId;
  if (enrollmentId) query.enrollmentId = enrollmentId;
  if (status) query.status = status;

  if (assignedClassIds && Array.isArray(assignedClassIds)) {
    query.classId = { $in: assignedClassIds };
  }

  const reportCards = await ReportCard.find(query)
    .populate('examId', 'name examType')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, 'Report cards retrieved successfully', reportCards);
};

export const getMyReportCards = async (req: Request, res: Response): Promise<void> => {
  const { enrollmentIds, studentIds, status } = req.query;

  const query: Record<string, any> = {
    status: status || 'PUBLISHED',
  };

  if (enrollmentIds && Array.isArray(enrollmentIds) && enrollmentIds.length > 0) {
    query.enrollmentId = { $in: enrollmentIds };
  } else if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
    query.studentId = { $in: studentIds };
  } else {
    sendSuccess(res, 200, 'My report cards retrieved successfully', []);
    return;
  }

  const reportCards = await ReportCard.find(query)
    .populate('examId', 'name examType')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, 'My report cards retrieved successfully', reportCards);
};

export const getReportCardById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const reportCard = await ReportCard.findById(id)
    .populate('examId', 'name examType')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('templateId', 'name branding signatures layout');

  if (!reportCard || reportCard.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Report card not found');
  }

  sendSuccess(res, 200, 'Report card retrieved successfully', reportCard);
};

export const generateReportCards = async (req: Request, res: Response): Promise<void> => {
  const parsed = GenerateReportCardSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid generate report card payload',
      parsed.error.errors
    );
  }

  const {
    academicSessionId,
    academicTermId,
    examId,
    classId,
    sectionId,
    enrollmentId,
    templateId,
    changeReason,
  } = parsed.data;

  // Resolve template ID (or default template for session/class)
  let resolvedTemplateId = templateId;
  if (!resolvedTemplateId) {
    const defaultTpl = await ReportCardTemplate.findOne({
      academicSessionId,
      isDefault: true,
      status: 'ACTIVE',
    });
    if (defaultTpl) {
      resolvedTemplateId = defaultTpl._id.toString();
    }
  }

  // Find Result records
  const resultQuery: Record<string, any> = {
    examId,
    classId,
    status: { $ne: 'ARCHIVED' },
  };
  if (sectionId) resultQuery.sectionId = sectionId;
  if (enrollmentId) resultQuery.enrollmentId = enrollmentId;

  const results = await Result.find(resultQuery);
  if (!results || results.length === 0) {
    throw new AppError(
      404,
      ErrorCodes.RESOURCE_NOT_FOUND,
      'No examination result records found for the specified criteria'
    );
  }

  // Freeze attendance sessions for the class/session when generating report cards
  await Attendance.updateMany(
    {
      academicSessionId,
      classId,
      isFrozen: false,
      status: 'ACTIVE',
    },
    {
      $set: {
        isFrozen: true,
        sessionStatus: 'FROZEN',
        frozenAt: new Date(),
        frozenByUserId: (req as any).user.id,
        freezeReason: 'Attendance session is frozen due to report card generation',
      },
    }
  );

  const generatedReportCards = [];

  for (const result of results) {
    // 1. Compute dynamic attendance summary from AttendanceEntry
    const attEntries = await AttendanceEntry.find({
      enrollmentId: result.enrollmentId,
      academicSessionId,
    });

    const workingDays = attEntries.length;
    let presentDays = 0;
    let absentDays = 0;
    let leaveDays = 0;
    let lateDays = 0;

    for (const entry of attEntries) {
      const st = entry.attendanceStatus;
      if (st === 'PRESENT' || st === 'LATE' || st === 'EXCUSED') {
        presentDays++;
      } else if (st === 'ABSENT' || st === 'UNAPPROVED_LEAVE') {
        absentDays++;
      } else if (st === 'MEDICAL_LEAVE' || st === 'APPROVED_LEAVE' || st === 'HALF_DAY') {
        leaveDays++;
      }
      if (st === 'LATE' || (entry.lateMinutes && entry.lateMinutes > 0)) {
        lateDays++;
      }
    }

    const attendancePercentage =
      workingDays > 0 ? Number(((presentDays / workingDays) * 100).toFixed(2)) : 100;

    const attendanceSummary: AttendanceSummary = {
      workingDays,
      presentDays,
      absentDays,
      leaveDays,
      lateDays,
      attendancePercentage,
    };

    // 2. Map subject results
    const subjectResults: ReportCardSubjectSummary[] = result.subjectResults.map((sr) => ({
      classSubjectId: sr.classSubjectId.toString(),
      subjectName: sr.subjectName,
      theoryMarks: sr.totalMarksObtained,
      practicalMarks: 0,
      internalMarks: 0,
      totalMarks: sr.totalMarksObtained,
      maximumMarks: sr.maximumMarks,
      percentage: sr.percentage,
      grade: sr.grade,
      gradePoint: sr.gradePoint,
      remarks: sr.isPassed ? 'Passed' : 'Needs Improvement',
    }));

    // 3. Construct merit ranking
    const meritRanking: MeritRanking = {
      rankInClass: result.rankInClass,
      rankInSection: result.rankInSection,
      overallPercentage: result.overallPercentage,
      gpa: result.overallGradePoint,
    };

    const existingRC = await ReportCard.findOne({
      examId: result.examId,
      enrollmentId: result.enrollmentId,
    });

    if (existingRC) {
      // Regenerate: Archive snapshot into ReportCardVersion and increment versionNumber
      await ReportCardVersion.create({
        reportCardId: existingRC._id,
        versionNumber: existingRC.versionNumber,
        generatedAt: new Date(),
        generatedBy: (req as any).user.id,
        changeReason: changeReason || 'Regenerated after result modification',
        snapshotData: existingRC.toObject(),
        pdfUrl: existingRC.pdfUrl,
        createdBy: (req as any).user.id,
        updatedBy: (req as any).user.id,
      });

      const nextVersion = existingRC.versionNumber + 1;

      existingRC.subjectResults = subjectResults;
      existingRC.attendanceSummary = attendanceSummary;
      existingRC.meritRanking = meritRanking;
      if (resolvedTemplateId) existingRC.templateId = resolvedTemplateId as any;
      existingRC.versionNumber = nextVersion;
      existingRC.versionHistory.push({
        versionNumber: nextVersion,
        generatedAt: new Date(),
        generatedBy: (req as any).user.id,
        changeReason: changeReason || 'Regenerated after result modification',
        pdfUrl: `/api/v1/report-cards/${existingRC._id}/download?version=${nextVersion}`,
      });
      existingRC.pdfUrl = `/api/v1/report-cards/${existingRC._id}/download?version=${nextVersion}`;
      existingRC.updatedBy = (req as any).user.id;

      await existingRC.save();
      generatedReportCards.push(existingRC);
    } else {
      // Create new draft report card
      const reportCardNumber = `RC-${result.examId.toString().slice(-4)}-${result.enrollmentId.toString().slice(-6)}`;
      const newRC = await ReportCard.create({
        reportCardNumber,
        academicSessionId,
        academicTermId,
        examId: result.examId,
        enrollmentId: result.enrollmentId,
        studentId: result.studentId,
        classId: result.classId,
        sectionId: result.sectionId,
        templateId: resolvedTemplateId,
        subjectResults,
        attendanceSummary,
        meritRanking,
        remarks: {
          classTeacherRemarks: '',
          principalRemarks: '',
          autoRemarks:
            result.resultStatus === 'PASS' ? 'Promoted / Passed with good standing' : 'Needs improvement',
        },
        versionNumber: 1,
        versionHistory: [
          {
            versionNumber: 1,
            generatedAt: new Date(),
            generatedBy: (req as any).user.id,
            changeReason: 'Initial compilation',
            pdfUrl: '',
          },
        ],
        status: 'DRAFT',
        createdBy: (req as any).user.id,
        updatedBy: (req as any).user.id,
      });

      newRC.pdfUrl = `/api/v1/report-cards/${newRC._id}/download?version=1`;
      if (newRC.versionHistory && newRC.versionHistory[0]) {
        newRC.versionHistory[0].pdfUrl = newRC.pdfUrl;
      }
      await newRC.save();

      generatedReportCards.push(newRC);
    }
  }

  sendSuccess(res, 200, 'Report cards generated successfully', generatedReportCards);
};

export const publishReportCards = async (req: Request, res: Response): Promise<void> => {
  const parsed = PublishReportCardsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid publish report cards payload',
      parsed.error.errors
    );
  }

  const { reportCardIds } = parsed.data;

  const result = await ReportCard.updateMany(
    {
      _id: { $in: reportCardIds },
      status: { $ne: 'ARCHIVED' },
    },
    {
      $set: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedBy: (req as any).user.id,
        updatedBy: (req as any).user.id,
      },
    }
  );

  sendSuccess(res, 200, 'Report cards published successfully', {
    publishedCount: result.modifiedCount,
  });
};

export const updateReportCardRemarks = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = UpdateReportCardRemarksSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid remarks update payload',
      parsed.error.errors
    );
  }

  const reportCard = await ReportCard.findById(id);
  if (!reportCard || reportCard.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Report card not found');
  }

  if (reportCard.status === 'PUBLISHED') {
    throw new AppError(
      400,
      ErrorCodes.BUSINESS_RULE_VIOLATION,
      'Cannot edit remarks on a published report card. Regenerate to create a new version.'
    );
  }

  if (!reportCard.remarks) {
    reportCard.remarks = {};
  }
  if (parsed.data.classTeacherRemarks !== undefined) {
    reportCard.remarks.classTeacherRemarks = parsed.data.classTeacherRemarks;
  }
  if (parsed.data.principalRemarks !== undefined) {
    reportCard.remarks.principalRemarks = parsed.data.principalRemarks;
  }
  if (parsed.data.autoRemarks !== undefined) {
    reportCard.remarks.autoRemarks = parsed.data.autoRemarks;
  }

  reportCard.updatedBy = (req as any).user.id;
  await reportCard.save();

  sendSuccess(res, 200, 'Report card remarks updated successfully', reportCard);
};

export const downloadReportCardPdf = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { version } = req.query;

  const reportCard = await ReportCard.findById(id)
    .populate('examId', 'name examType')
    .populate('classId', 'name')
    .populate('sectionId', 'name')
    .populate('templateId', 'name branding signatures layout');

  if (!reportCard || reportCard.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Report card not found');
  }

  if (version && Number(version) !== reportCard.versionNumber) {
    const historicalVersion = await ReportCardVersion.findOne({
      reportCardId: id,
      versionNumber: Number(version),
    });
    if (!historicalVersion) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Specified report card version not found');
    }
    sendSuccess(res, 200, 'Report card PDF link retrieved successfully', {
      reportCardId: reportCard._id,
      reportCardNumber: reportCard.reportCardNumber,
      versionNumber: historicalVersion.versionNumber,
      pdfUrl: historicalVersion.pdfUrl || `/api/v1/report-cards/${reportCard._id}/download?version=${version}`,
      snapshotData: historicalVersion.snapshotData,
    });
    return;
  }

  sendSuccess(res, 200, 'Report card PDF link retrieved successfully', {
    reportCardId: reportCard._id,
    reportCardNumber: reportCard.reportCardNumber,
    versionNumber: reportCard.versionNumber,
    pdfUrl: reportCard.pdfUrl || `/api/v1/report-cards/${reportCard._id}/download?version=${reportCard.versionNumber}`,
    reportCardData: reportCard,
  });
};

export const archiveReportCard = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const reportCard = await ReportCard.findById(id);

  if (!reportCard || reportCard.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Report card not found');
  }

  reportCard.status = 'ARCHIVED';
  reportCard.archivedAt = new Date();
  reportCard.archivedBy = (req as any).user.id;
  reportCard.updatedBy = (req as any).user.id;

  await reportCard.save();

  sendSuccess(res, 200, 'Report card archived successfully', reportCard);
};
