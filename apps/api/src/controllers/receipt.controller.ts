import { Request, Response } from 'express';
import { ErrorCodes } from '@laps/shared';
import { Receipt } from '../models/Receipt';
import { ReceiptVersion } from '../models/ReceiptVersion';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const getReceiptByNumber = async (req: Request, res: Response): Promise<void> => {
  const { receiptNumber } = req.params;
  const receipt = await Receipt.findOne({ receiptNumber })
    .populate('paymentId', 'paymentTransactionId amountPaid paymentMode paymentDate status')
    .populate('studentId', 'admissionNumber firstName lastName')
    .populate('invoiceIds', 'invoiceNumber title dueDate netTotal');

  if (!receipt) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Receipt not found');
  }

  if (req.feeScopedStudentIds && !req.feeScopedStudentIds.includes(receipt.studentId._id.toString())) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'You are not authorized to view this receipt'
    );
  }

  sendSuccess(res, 200, 'Receipt retrieved successfully', receipt);
};

export const listReceiptVersions = async (req: Request, res: Response): Promise<void> => {
  const { receiptNumber } = req.params;
  const receipt = await Receipt.findOne({ receiptNumber });
  if (!receipt) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Receipt not found');
  }

  if (req.feeScopedStudentIds && !req.feeScopedStudentIds.includes(receipt.studentId.toString())) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'You are not authorized to view this receipt history'
    );
  }

  const versions = await ReceiptVersion.find({ receiptId: receipt._id })
    .sort({ versionNumber: -1 })
    .populate('generatedBy', 'firstName lastName email');

  sendSuccess(res, 200, 'Receipt version history retrieved successfully', {
    receiptNumber,
    currentVersion: receipt.versionNumber,
    history: versions,
  });
};

export const verifyReceipt = async (req: Request, res: Response): Promise<void> => {
  const { receiptNumber } = req.params;
  const { hash } = req.query;

  const receipt = await Receipt.findOne({ receiptNumber })
    .populate('paymentId', 'paymentTransactionId amountPaid paymentDate status')
    .populate('studentId', 'admissionNumber firstName lastName');

  if (!receipt) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Receipt not found');
  }

  const isHashValid = hash ? receipt.verificationHash === hash : true;

  sendSuccess(res, 200, 'Receipt authenticity verification result', {
    receiptNumber: receipt.receiptNumber,
    isValid: isHashValid && receipt.status === 'ACTIVE',
    status: receipt.status,
    issuedDate: receipt.issuedDate,
    totalAmount: receipt.totalAmount,
    paymentMode: receipt.paymentMode,
    verificationHash: receipt.verificationHash,
    qrCodeUrl: receipt.qrCodeUrl,
  });
};

export const downloadReceiptPdf = async (req: Request, res: Response): Promise<void> => {
  const { receiptNumber } = req.params;
  const receipt = await Receipt.findOne({ receiptNumber });

  if (!receipt) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Receipt not found');
  }

  if (req.feeScopedStudentIds && !req.feeScopedStudentIds.includes(receipt.studentId.toString())) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'You are not authorized to download this receipt'
    );
  }

  sendSuccess(res, 200, 'Receipt PDF URL generated', {
    receiptNumber: receipt.receiptNumber,
    pdfUrl: receipt.pdfUrl || `/api/v1/receipts/${receiptNumber}/pdf`,
  });
};
