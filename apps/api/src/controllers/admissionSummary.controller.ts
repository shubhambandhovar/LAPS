import { Request, Response } from 'express';
import { AdmissionApplication } from '../models/AdmissionApplication';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes } from '@laps/shared';

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { cycleId } = req.query;
    const query: any = {};
    if (cycleId) query.admissionCycleId = cycleId;

    const totalApplications = await AdmissionApplication.countDocuments(query);
    const approved = await AdmissionApplication.countDocuments({ ...query, status: 'APPROVED' });
    const pendingReview = await AdmissionApplication.countDocuments({ ...query, status: { $in: ['SUBMITTED', 'UNDER_REVIEW', 'DOCUMENTS_PENDING'] } });
    const rejected = await AdmissionApplication.countDocuments({ ...query, status: 'REJECTED' });

    const conversionRate = totalApplications > 0 ? ((approved / totalApplications) * 100).toFixed(2) : 0;

    // Applications by class
    const byClassRaw = await AdmissionApplication.aggregate([
      { $match: query },
      { $group: { _id: '$appliedClassId', count: { $sum: 1 } } },
      { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'classData' } },
      { $unwind: '$classData' },
      { $project: { className: '$classData.name', count: 1 } }
    ]);

    const applicationsByClass = byClassRaw.reduce((acc, curr) => {
      acc[curr.className] = curr.count;
      return acc;
    }, {});

    return sendSuccess(res, 200, 'Success', {
      totalApplications,
      approved,
      pendingReview,
      rejected,
      conversionRate,
      applicationsByClass
    });
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch admission analytics');
  }
};
