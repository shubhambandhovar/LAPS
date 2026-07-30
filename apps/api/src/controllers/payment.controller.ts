import { Request, Response } from 'express';
import {
  RecordPaymentSchema,
  RefundPaymentSchema,
  ReversePaymentSchema,
  ErrorCodes,
} from '@laps/shared';
import { Payment } from '../models/Payment';
import { Invoice } from '../models/Invoice';
import { Receipt } from '../models/Receipt';
import { ReceiptVersion } from '../models/ReceiptVersion';
import { StudentFeeLedger } from '../models/StudentFeeLedger';
import { FinancialSummary } from '../models/FinancialSummary';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

async function updateSummaryCollection(
  academicSessionId: string,
  classId: string,
  mode: string,
  amountDelta: number,
  outstandingDelta: number
): Promise<void> {
  const modeKey = mode.toLowerCase() === 'bank_transfer' ? 'bankTransfer' : mode.toLowerCase() === 'online_gateway' ? 'onlineGateway' : mode.toLowerCase();

  const incObj: Record<string, number> = {
    totalCollected: amountDelta,
    totalOutstanding: outstandingDelta,
  };
  if (['cash', 'upi', 'card', 'bankTransfer', 'cheque', 'onlineGateway'].includes(modeKey)) {
    incObj[`collectionByMode.${modeKey}`] = amountDelta;
  }

  await FinancialSummary.findOneAndUpdate(
    { academicSessionId, classId },
    { $inc: incObj, $set: { lastCalculatedAt: new Date() } },
    { upsert: true, new: true }
  );

  await FinancialSummary.findOneAndUpdate(
    { academicSessionId, classId: null },
    { $inc: incObj, $set: { lastCalculatedAt: new Date() } },
    { upsert: true, new: true }
  );
}

export const listPayments = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, studentId, enrollmentId, status, paymentMode, page = '1', limit = '20' } = req.query;

  const query: Record<string, unknown> = {};
  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (studentId) query.studentId = studentId;
  if (enrollmentId) query.enrollmentId = enrollmentId;
  if (status && status !== 'ALL') query.status = status;
  if (paymentMode && paymentMode !== 'ALL') query.paymentMode = paymentMode;

  if (req.feeScopedStudentIds && req.feeScopedStudentIds.length > 0) {
    query.studentId = { $in: req.feeScopedStudentIds };
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.max(1, parseInt(limit as string, 10));
  const skip = (pageNum - 1) * limitNum;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .populate('studentId', 'admissionNumber firstName lastName')
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Payment.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  sendSuccess(res, 200, 'Payments retrieved successfully', payments, {
    totalRecords: total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  });
};

export const getPaymentById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const payment = await Payment.findById(id)
    .populate('studentId', 'admissionNumber firstName lastName')
    .populate('recordedByUserId', 'firstName lastName email')
    .populate('allocations.invoiceId', 'invoiceNumber title netTotal outstandingAmount status');

  if (!payment) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Payment not found');
  }

  if (req.feeScopedStudentIds && !req.feeScopedStudentIds.includes(payment.studentId._id.toString())) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'You are not authorized to view this payment'
    );
  }

  sendSuccess(res, 200, 'Payment retrieved successfully', payment);
};

export const recordPayment = async (req: Request, res: Response): Promise<void> => {
  const validated = RecordPaymentSchema.parse(req.body);

  const totalAllocated = validated.allocations.reduce((sum, a) => sum + a.amountAllocated, 0);
  if (totalAllocated > validated.amountPaid) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      `Total allocated amount (${totalAllocated}) cannot exceed amount paid (${validated.amountPaid})`
    );
  }

  const invoiceIds = validated.allocations.map((a) => a.invoiceId);
  const invoices = await Invoice.find({ _id: { $in: invoiceIds } });

  if (invoices.length !== invoiceIds.length) {
    throw new AppError(
      404,
      ErrorCodes.RESOURCE_NOT_FOUND,
      'One or more target invoices for allocation were not found'
    );
  }

  for (const alloc of validated.allocations) {
    const targetInvoice = invoices.find((i) => i._id.toString() === alloc.invoiceId);
    if (!targetInvoice) continue;

    if (targetInvoice.status === 'PAID' || targetInvoice.status === 'CANCELLED' || targetInvoice.status === 'WAIVED') {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Invoice ${targetInvoice.invoiceNumber} is already in state ${targetInvoice.status}`
      );
    }

    if (alloc.amountAllocated > targetInvoice.outstandingAmount) {
      throw new AppError(
        400,
        ErrorCodes.VALIDATION_ERROR,
        `Allocation (${alloc.amountAllocated}) exceeds outstanding balance (${targetInvoice.outstandingAmount}) on invoice ${targetInvoice.invoiceNumber}`
      );
    }
  }

  const now = new Date();
  const paymentTransactionId = `PAY-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(10000 + Math.random() * 90000))}`;

  const payment = await Payment.create({
    paymentTransactionId,
    academicSessionId: validated.academicSessionId,
    financialYearId: validated.financialYearId,
    enrollmentId: validated.enrollmentId,
    studentId: validated.studentId,
    paidByGuardianId: validated.paidByGuardianId,
    recordedByUserId: validated.recordedByUserId,
    amountPaid: validated.amountPaid,
    paymentMode: validated.paymentMode,
    referenceNumber: validated.referenceNumber,
    paymentDate: new Date(validated.paymentDate),
    allocations: validated.allocations,
    status: 'ACTIVE',
    remarks: validated.remarks,
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  let firstClassId = '';
  for (const alloc of validated.allocations) {
    const targetInvoice = invoices.find((i) => i._id.toString() === alloc.invoiceId);
    if (!targetInvoice) continue;

    if (!firstClassId) firstClassId = targetInvoice.classId.toString();

    targetInvoice.paidAmount += alloc.amountAllocated;
    targetInvoice.outstandingAmount -= alloc.amountAllocated;
    if (targetInvoice.outstandingAmount === 0) {
      targetInvoice.status = 'PAID';
    } else {
      targetInvoice.status = 'PARTIALLY_PAID';
    }
    targetInvoice.updatedBy = req.user?.id as any;
    await targetInvoice.save();
  }

  const receiptNumber = `REC-${now.getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`;
  const verificationHash = `SHA256-REC-${receiptNumber}-${payment.amountPaid}-${Date.now()}`;
  const qrCodeUrl = `/verify-receipt?rec=${receiptNumber}&hash=${verificationHash}`;

  const receipt = await Receipt.create({
    receiptNumber,
    paymentId: payment._id,
    invoiceIds: invoiceIds as any,
    enrollmentId: validated.enrollmentId,
    studentId: validated.studentId,
    issuedDate: payment.paymentDate,
    totalAmount: payment.amountPaid,
    paymentMode: payment.paymentMode,
    pdfUrl: `/api/v1/receipts/${receiptNumber}/pdf`,
    verificationHash,
    qrCodeUrl,
    versionNumber: 1,
    versionHistory: [
      {
        versionNumber: 1,
        generatedAt: now,
        generatedBy: req.user?.id,
        changeReason: 'Original Receipt Issued',
        pdfUrl: `/api/v1/receipts/${receiptNumber}/pdf`,
      },
    ],
    status: 'ACTIVE',
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  await StudentFeeLedger.findOneAndUpdate(
    {
      academicSessionId: validated.academicSessionId,
      enrollmentId: validated.enrollmentId,
    },
    {
      $setOnInsert: {
        studentId: validated.studentId,
        classId: firstClassId || validated.academicSessionId,
        financialYearId: validated.financialYearId,
        createdBy: req.user?.id,
      },
      $set: { updatedBy: req.user?.id, lastUpdatedAt: new Date() },
      $inc: { totalPaid: payment.amountPaid, outstandingBalance: -payment.amountPaid },
      $push: {
        ledgerEntries: {
          entryId: `LED-PAY-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
          date: payment.paymentDate,
          entryType: 'PAYMENT',
          referenceId: payment._id,
          referenceNumber: receiptNumber,
          description: `Fee Payment Received (${payment.paymentMode})`,
          debit: 0,
          credit: payment.amountPaid,
          runningBalance: 0,
        },
      },
    },
    { upsert: true, new: true }
  );

  if (firstClassId) {
    await updateSummaryCollection(
      validated.academicSessionId,
      firstClassId,
      payment.paymentMode,
      payment.amountPaid,
      -payment.amountPaid
    );
  }

  sendSuccess(res, 201, 'Payment recorded and receipt generated successfully', {
    payment,
    receipt,
  });
};

export const refundPayment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = RefundPaymentSchema.parse(req.body);

  const payment = await Payment.findById(id);
  if (!payment) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Payment not found');
  }

  if (payment.status !== 'ACTIVE' && payment.status !== 'COMPLETED') {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      `Cannot refund payment in state ${payment.status}`
    );
  }

  const refundAmt = validated.refundedAmount || payment.amountPaid;

  payment.status = 'REFUNDED';
  payment.refundDetails = {
    auditReason: validated.auditReason,
    approvedBy: validated.approvedBy as any,
    refundedAt: new Date(),
    refundedAmount: refundAmt,
  };
  payment.updatedBy = req.user?.id as any;
  await payment.save();

  await StudentFeeLedger.findOneAndUpdate(
    {
      academicSessionId: payment.academicSessionId,
      enrollmentId: payment.enrollmentId,
    },
    {
      $inc: { totalRefunded: refundAmt, outstandingBalance: refundAmt },
      $set: { updatedBy: req.user?.id, lastUpdatedAt: new Date() },
      $push: {
        ledgerEntries: {
          entryId: `LED-REF-${Date.now()}`,
          date: new Date(),
          entryType: 'REFUND',
          referenceId: payment._id,
          referenceNumber: payment.paymentTransactionId,
          description: `Payment Refunded: ${validated.auditReason}`,
          debit: refundAmt,
          credit: 0,
          runningBalance: 0,
        },
      },
    }
  );

  sendSuccess(res, 200, 'Payment refunded successfully', payment);
};

export const reversePayment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = ReversePaymentSchema.parse(req.body);

  const payment = await Payment.findById(id);
  if (!payment) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Payment not found');
  }

  if (payment.status === 'REVERSED') {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Payment is already reversed');
  }

  payment.status = 'REVERSED';
  payment.reversalDetails = {
    auditReason: validated.auditReason,
    approvedBy: validated.approvedBy as any,
    reversedAt: new Date(),
  };
  payment.updatedBy = req.user?.id as any;
  await payment.save();

  let firstClassId = '';
  for (const alloc of payment.allocations) {
    const inv = await Invoice.findById(alloc.invoiceId);
    if (!inv) continue;

    if (!firstClassId) firstClassId = inv.classId.toString();

    inv.paidAmount = Math.max(0, inv.paidAmount - alloc.amountAllocated);
    inv.outstandingAmount += alloc.amountAllocated;
    if (inv.paidAmount === 0) {
      inv.status = 'ISSUED';
    } else {
      inv.status = 'PARTIALLY_PAID';
    }
    inv.updatedBy = req.user?.id as any;
    await inv.save();
  }

  const receipt = await Receipt.findOne({ paymentId: payment._id });
  if (receipt) {
    const nextVerNum = receipt.versionNumber + 1;
    await ReceiptVersion.create({
      receiptId: receipt._id,
      versionNumber: nextVerNum,
      generatedAt: new Date(),
      generatedBy: req.user?.id,
      changeReason: `Payment Reversed: ${validated.auditReason}`,
      snapshotData: {
        receiptNumber: receipt.receiptNumber,
        status: 'CANCELLED',
        reversalReason: validated.auditReason,
      },
      pdfUrl: receipt.pdfUrl,
      verificationHash: receipt.verificationHash,
      qrCodeUrl: receipt.qrCodeUrl,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    receipt.status = 'CANCELLED';
    receipt.versionNumber = nextVerNum;
    receipt.versionHistory.push({
      versionNumber: nextVerNum,
      generatedAt: new Date(),
      generatedBy: req.user?.id as any,
      changeReason: `Payment Reversed: ${validated.auditReason}`,
      pdfUrl: receipt.pdfUrl,
    });
    receipt.updatedBy = req.user?.id as any;
    await receipt.save();
  }

  await StudentFeeLedger.findOneAndUpdate(
    {
      academicSessionId: payment.academicSessionId,
      enrollmentId: payment.enrollmentId,
    },
    {
      $inc: { totalPaid: -payment.amountPaid, outstandingBalance: payment.amountPaid },
      $set: { updatedBy: req.user?.id, lastUpdatedAt: new Date() },
      $push: {
        ledgerEntries: {
          entryId: `LED-REV-${Date.now()}`,
          date: new Date(),
          entryType: 'ADJUSTMENT',
          referenceId: payment._id,
          referenceNumber: payment.paymentTransactionId,
          description: `Payment Reversal: ${validated.auditReason}`,
          debit: payment.amountPaid,
          credit: 0,
          runningBalance: 0,
        },
      },
    }
  );

  if (firstClassId) {
    await updateSummaryCollection(
      payment.academicSessionId.toString(),
      firstClassId,
      payment.paymentMode,
      -payment.amountPaid,
      payment.amountPaid
    );
  }

  sendSuccess(res, 200, 'Payment reversed successfully', payment);
};
