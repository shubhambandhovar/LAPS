import { Request, Response } from 'express';
import { AdmissionDocument } from '../models/AdmissionDocument';
import { AdmissionApplication } from '../models/AdmissionApplication';
import { sendSuccess, sendError } from '../utils/response';
import { ErrorCodes } from '@laps/shared';

export const uploadDocument = async (req: Request, res: Response) => {
  try {
    const { applicationId, documentType, fileUrl } = req.body;

    // Verify application belongs to user
    const application = await AdmissionApplication.findById(applicationId);
    if (!application) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Application not found');
    }
    if (application.applicantUserId.toString() !== req.user!.id && !['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMISSION_OFFICER'].includes(req.user!.role)) {
      return sendError(res, 403, ErrorCodes.AUTH_TOKEN_EXPIRED, 'Access denied');
    }

    const doc = await AdmissionDocument.create({
      applicationId,
      documentType,
      fileUrl,
      verificationStatus: 'PENDING',
    });

    return sendSuccess(res, 201, 'Success', doc);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to upload document');
  }
};

export const getDocumentsForApplication = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    
    // Auth verification handled implicitly via applicant or admin checking. Assuming Admin/Applicant.
    const docs = await AdmissionDocument.find({ applicationId });
    return sendSuccess(res, 200, 'Success', docs);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to fetch documents');
  }
};

export const verifyDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { verificationStatus, remarks } = req.body;

    const doc = await AdmissionDocument.findByIdAndUpdate(
      id,
      { verificationStatus, remarks },
      { new: true }
    );

    if (!doc) {
      return sendError(res, 404, ErrorCodes.RESOURCE_NOT_FOUND, 'Document not found');
    }

    return sendSuccess(res, 200, 'Success', doc);
  } catch (error) {
    return sendError(res, 500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Failed to verify document');
  }
};
