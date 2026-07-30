import { Request, Response } from 'express';
import {
  EvaluatePromotionSchema,
  CreatePromotionDecisionSchema,
  ApprovePromotionsSchema,
  ErrorCodes,
} from '@laps/shared';
import { PromotionDecision } from '../models/PromotionDecision';
import { Enrollment } from '../models/Enrollment';
import { Result } from '../models/Result';
import { AttendanceEntry } from '../models/AttendanceEntry';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listPromotions = async (req: Request, res: Response): Promise<void> => {
  const {
    academicSessionId,
    academicTermId,
    classId,
    sectionId,
    studentId,
    enrollmentId,
    promotionStatus,
    status,
    assignedClassIds,
  } = req.query;

  const query: Record<string, any> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (academicTermId) query.academicTermId = academicTermId;
  if (classId) query.fromClassId = classId;
  if (sectionId) query.fromSectionId = sectionId;
  if (studentId) query.studentId = studentId;
  if (enrollmentId) query.enrollmentId = enrollmentId;
  if (promotionStatus) query.promotionStatus = promotionStatus;
  if (status) query.status = status;

  if (assignedClassIds && Array.isArray(assignedClassIds)) {
    query.fromClassId = { $in: assignedClassIds };
  }

  const promotions = await PromotionDecision.find(query)
    .populate('studentId', 'firstName lastName admissionNumber')
    .populate('fromClassId', 'name')
    .populate('fromSectionId', 'name')
    .populate('toClassId', 'name')
    .populate('toSectionId', 'name')
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, 'Promotion decisions retrieved successfully', promotions);
};

export const evaluatePromotions = async (req: Request, res: Response): Promise<void> => {
  const parsed = EvaluatePromotionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid evaluate promotion payload',
      parsed.error.errors
    );
  }

  const {
    academicSessionId,
    academicTermId,
    classId,
    sectionId,
    minPassPercentage,
    minAttendancePercentage,
  } = parsed.data;

  const enrollmentQuery: Record<string, any> = {
    academicSessionId,
    classId,
    enrollmentStatus: 'ACTIVE',
  };
  if (sectionId) enrollmentQuery.sectionId = sectionId;

  const enrollments = await Enrollment.find(enrollmentQuery);
  if (!enrollments || enrollments.length === 0) {
    throw new AppError(
      404,
      ErrorCodes.RESOURCE_NOT_FOUND,
      'No active student enrollments found for the specified class/section'
    );
  }

  const evaluatedPromotions = [];

  for (const enrollment of enrollments) {
    // 1. Check latest exam result for the student in this session
    const latestResult = await Result.findOne({
      academicSessionId,
      enrollmentId: enrollment._id,
      status: { $ne: 'ARCHIVED' },
    }).sort({ createdAt: -1 });

    // 2. Check attendance entries
    const attEntries = await AttendanceEntry.find({
      enrollmentId: enrollment._id,
      academicSessionId,
    });
    const workingDays = attEntries.length;
    let presentDays = 0;
    for (const entry of attEntries) {
      if (entry.attendanceStatus === 'PRESENT' || entry.attendanceStatus === 'LATE' || entry.attendanceStatus === 'EXCUSED') {
        presentDays++;
      }
    }
    const attendancePercentage = workingDays > 0 ? (presentDays / workingDays) * 100 : 100;

    // 3. Evaluate promotion recommendation
    let recommendedStatus: 'PROMOTED' | 'PROMOTED_CONDITIONALLY' | 'DETAINED' = 'PROMOTED';
    let remarks = 'Recommended for promotion';

    const resultPass = latestResult ? latestResult.resultStatus === 'PASS' : false;
    const percentagePass = latestResult ? latestResult.overallPercentage >= minPassPercentage : true;
    const attPass = attendancePercentage >= minAttendancePercentage;

    if (!resultPass || !percentagePass) {
      if (latestResult && latestResult.overallPercentage >= minPassPercentage - 5) {
        recommendedStatus = 'PROMOTED_CONDITIONALLY';
        remarks = `Conditional promotion due to borderline marks (${latestResult.overallPercentage}%)`;
      } else {
        recommendedStatus = 'DETAINED';
        remarks = `Recommended for detention: Low academic marks (${latestResult?.overallPercentage || 0}%)`;
      }
    } else if (!attPass) {
      recommendedStatus = 'PROMOTED_CONDITIONALLY';
      remarks = `Conditional promotion: Attendance (${attendancePercentage.toFixed(1)}%) below ${minAttendancePercentage}% threshold`;
    }

    // 4. Upsert PromotionDecision
    const existing = await PromotionDecision.findOne({
      academicSessionId,
      enrollmentId: enrollment._id,
      status: { $ne: 'ARCHIVED' },
    });

    if (existing) {
      if (existing.status !== 'APPROVED') {
        existing.promotionStatus = recommendedStatus;
        existing.remarks = remarks;
        existing.updatedBy = (req as any).user.id;
        await existing.save();
      }
      evaluatedPromotions.push(existing);
    } else {
      const created = await PromotionDecision.create({
        academicSessionId,
        academicTermId,
        enrollmentId: enrollment._id,
        studentId: enrollment.studentId,
        fromClassId: enrollment.classId,
        fromSectionId: enrollment.sectionId,
        promotionStatus: recommendedStatus,
        remarks,
        status: 'DRAFT',
        createdBy: (req as any).user.id,
        updatedBy: (req as any).user.id,
      });
      evaluatedPromotions.push(created);
    }
  }

  sendSuccess(res, 200, 'Promotion evaluations completed successfully', evaluatedPromotions);
};

export const createOrUpdatePromotion = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreatePromotionDecisionSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid create promotion decision payload',
      parsed.error.errors
    );
  }

  const { academicSessionId, enrollmentId } = parsed.data;

  const existing = await PromotionDecision.findOne({
    academicSessionId,
    enrollmentId,
  });

  if (existing) {
    Object.assign(existing, parsed.data, {
      updatedBy: (req as any).user.id,
    });
    await existing.save();
    sendSuccess(res, 200, 'Promotion decision updated successfully', existing);
  } else {
    const promotion = await PromotionDecision.create({
      ...parsed.data,
      status: parsed.data.status || 'DRAFT',
      createdBy: (req as any).user.id,
      updatedBy: (req as any).user.id,
    });
    sendSuccess(res, 201, 'Promotion decision created successfully', promotion);
  }
};

export const approvePromotions = async (req: Request, res: Response): Promise<void> => {
  const parsed = ApprovePromotionsSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Invalid approve promotions payload',
      parsed.error.errors
    );
  }

  const { promotionIds } = parsed.data;

  const result = await PromotionDecision.updateMany(
    {
      _id: { $in: promotionIds },
      status: { $ne: 'ARCHIVED' },
    },
    {
      $set: {
        status: 'APPROVED',
        decidedBy: (req as any).user.id,
        decidedAt: new Date(),
        updatedBy: (req as any).user.id,
      },
    }
  );

  sendSuccess(res, 200, 'Promotion decisions approved successfully', {
    approvedCount: result.modifiedCount,
  });
};

export const archivePromotion = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const promotion = await PromotionDecision.findById(id);

  if (!promotion || promotion.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Promotion decision not found');
  }

  promotion.status = 'ARCHIVED';
  promotion.archivedAt = new Date();
  promotion.archivedBy = (req as any).user.id;
  promotion.updatedBy = (req as any).user.id;

  await promotion.save();
  sendSuccess(res, 200, 'Promotion decision archived successfully', promotion);
};
