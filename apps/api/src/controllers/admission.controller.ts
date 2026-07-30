import { Request, Response } from 'express';
import { AdmissionApplication } from '../models/AdmissionApplication';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes, admissionApplicationSchema } from '@laps/shared';
import { z } from 'zod';

const generateApplicationNumber = async () => {
  const currentYear = new Date().getFullYear();
  const count = await AdmissionApplication.countDocuments({
    createdAt: {
      $gte: new Date(`${currentYear}-01-01`),
      $lt: new Date(`${currentYear + 1}-01-01`),
    },
  });
  return `APP-${currentYear}-${String(count + 1).padStart(3, '0')}`;
};

export const submitApplication = async (req: Request, res: Response) => {
  try {
    const data = admissionApplicationSchema.parse(req.body);

    // Ensure applicant is not applying multiple times for the same cycle and class
    const existing = await AdmissionApplication.findOne({
      applicantUserId: req.user!.id,
      admissionCycleId: data.admissionCycleId,
      appliedClassId: data.appliedClassId,
      status: { $nin: ['CANCELLED', 'REJECTED'] }
    });

    if (existing) {
      return sendError(res, 409, ErrorCodes.DUPLICATE_RESOURCE, 'You have already applied for this class in this admission cycle');
    }

    const applicationNumber = await generateApplicationNumber();

    const application = await AdmissionApplication.create({
      ...data,
      applicationNumber,
      applicantUserId: req.user!.id,
      status: 'SUBMITTED',
      submissionDate: new Date(),
    });

    return sendSuccess(res, 201, 'Success', application);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(res, 400, ErrorCodes.VALIDATION_ERROR, 'Validation failed', (error.errors as any));
    }
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to submit application');
  }
};

export const saveDraftApplication = async (req: Request, res: Response) => {
  try {
    const data = req.body; // Allow partial saving for draft

    const existingDraft = await AdmissionApplication.findOne({
      applicantUserId: req.user!.id,
      status: 'DRAFT',
    });

    if (existingDraft) {
      const updated = await AdmissionApplication.findByIdAndUpdate(existingDraft._id, data, { new: true });
      return sendSuccess(res, 200, 'Success', updated);
    }

    const applicationNumber = await generateApplicationNumber();
    const application = await AdmissionApplication.create({
      ...data,
      applicationNumber,
      applicantUserId: req.user!.id,
      status: 'DRAFT',
    });

    return sendSuccess(res, 201, 'Success', application);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to save draft');
  }
};

export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const applications = await AdmissionApplication.find({ applicantUserId: req.user!.id })
      .populate('admissionCycleId', 'name')
      .populate('appliedClassId', 'name')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Success', applications);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch applications');
  }
};

export const getAllApplications = async (req: Request, res: Response) => {
  try {
    const { status, cycleId, classId } = req.query;
    const query: any = {};
    if (status) query.status = status;
    if (cycleId) query.admissionCycleId = cycleId;
    if (classId) query.appliedClassId = classId;

    const applications = await AdmissionApplication.find(query)
      .populate('admissionCycleId', 'name')
      .populate('appliedClassId', 'name')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Success', applications);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch applications');
  }
};

export const getApplicationDetails = async (req: Request, res: Response) => {
  try {
    const application = await AdmissionApplication.findById(req.params.id)
      .populate('admissionCycleId', 'name status')
      .populate('appliedClassId', 'name');

    if (!application) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Application not found');
    }

    return sendSuccess(res, 200, 'Success', application);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch application');
  }
};
