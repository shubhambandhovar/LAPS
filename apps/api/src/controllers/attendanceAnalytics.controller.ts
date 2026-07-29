import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ErrorCodes } from '@laps/shared';
import { AttendanceEntry } from '../models/AttendanceEntry';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

/**
 * GET /api/v1/attendance/analytics/summary
 * Retrieve aggregate attendance percentage statistics for students, classes, sections, and teachers across monthly or academic session scopes.
 *
 * Employs a materialized summary cache strategy in production; for real-time reporting,
 * aggregates active AttendanceEntry documents to compute student percentages, identify
 * defaulters (< 75% attendance), and summarize class-wise statistics.
 */
export async function getAnalyticsSummary(req: Request, res: Response): Promise<void> {
  const {
    academicSessionId,
    startDate,
    endDate,
    classId,
    sectionId,
  } = req.query;

  if (!academicSessionId) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'academicSessionId query parameter is required'
    );
  }

  const matchStage: any = {
    academicSessionId: new mongoose.Types.ObjectId(String(academicSessionId)),
    status: 'ACTIVE',
  };

  if (startDate && endDate) {
    matchStage.date = { $gte: String(startDate), $lte: String(endDate) };
  }
  if (classId) matchStage.classId = new mongoose.Types.ObjectId(String(classId));
  if (sectionId) matchStage.sectionId = new mongoose.Types.ObjectId(String(sectionId));


  // Aggregate by student to compute percentages and identify defaulters (< 75%)
  const studentAgg = await AttendanceEntry.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$studentId',
        studentName: { $first: '$studentName' },
        className: { $first: '$className' },
        sectionName: { $first: '$sectionName' },
        classId: { $first: '$classId' },
        sectionId: { $first: '$sectionId' },
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: {
            $cond: [
              {
                $in: [
                  '$attendanceStatus',
                  [
                    'PRESENT',
                    'LATE',
                    'MEDICAL_LEAVE',
                    'APPROVED_LEAVE',
                    'EXCUSED',
                  ],
                ],
              },
              1,
              {
                $cond: [{ $eq: ['$attendanceStatus', 'HALF_DAY'] }, 0.5, 0],
              },
            ],
          },
        },
      },
    },
    {
      $project: {
        studentId: '$_id',
        studentName: 1,
        className: 1,
        sectionName: 1,
        classId: 1,
        sectionId: 1,
        totalDays: 1,
        presentDays: 1,
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$presentDays', { $max: ['$totalDays', 1] }] },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
  ]);

  let totalPercSum = 0;
  const defaulters: any[] = [];
  const classSectionMap = new Map<string, any>();

  for (const item of studentAgg) {
    totalPercSum += item.percentage;
    if (item.percentage < 75.0) {
      defaulters.push({
        studentId: String(item.studentId),
        studentName: item.studentName,
        className: item.className,
        sectionName: item.sectionName,
        percentage: item.percentage,
        totalDays: item.totalDays,
        presentDays: item.presentDays,
      });
    }

    const csKey = `${item.classId}_${item.sectionId}`;
    if (!classSectionMap.has(csKey)) {
      classSectionMap.set(csKey, {
        classId: String(item.classId),
        className: item.className,
        sectionId: String(item.sectionId),
        sectionName: item.sectionName,
        sumPerc: 0,
        count: 0,
      });
    }
    const cs = classSectionMap.get(csKey);
    cs.sumPerc += item.percentage;
    cs.count += 1;
  }

  const totalStudents = studentAgg.length;
  const averageAttendancePercentage =
    totalStudents > 0 ? Number((totalPercSum / totalStudents).toFixed(2)) : 100;

  const classWiseBreakdown = Array.from(classSectionMap.values()).map((cs) => ({
    classId: cs.classId,
    className: cs.className,
    sectionId: cs.sectionId,
    sectionName: cs.sectionName,
    percentage:
      cs.count > 0 ? Number((cs.sumPerc / cs.count).toFixed(2)) : 100,
  }));

  sendSuccess(res, 200, 'Attendance analytics summary computed successfully', {
    academicSessionId,
    totalStudents,
    averageAttendancePercentage,
    defaultersCount: defaulters.length,
    defaulters,
    classWiseBreakdown,
  });
}
