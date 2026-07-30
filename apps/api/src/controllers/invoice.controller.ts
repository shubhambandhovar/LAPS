import { Request, Response } from 'express';
import {
  GenerateInvoicesSchema,
  CreateCustomInvoiceSchema,
  WaiveInvoiceSchema,
  CancelInvoiceSchema,
  ErrorCodes,
} from '@laps/shared';
import { Invoice } from '../models/Invoice';
import { Enrollment } from '../models/Enrollment';
import { FeeStructure } from '../models/FeeStructure';
import { StudentFeeLedger } from '../models/StudentFeeLedger';
import { FinancialSummary } from '../models/FinancialSummary';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

async function updateFinancialSummaryAfterInvoice(
  academicSessionId: string,
  classId: string,
  invoicedDelta: number,
  waivedDelta: number,
  outstandingDelta: number
): Promise<void> {
  const filter = { academicSessionId, classId };
  await FinancialSummary.findOneAndUpdate(
    filter,
    {
      $inc: {
        totalInvoiced: invoicedDelta,
        totalWaived: waivedDelta,
        totalOutstanding: outstandingDelta,
      },
      $set: { lastCalculatedAt: new Date() },
    },
    { upsert: true, new: true }
  );

  await FinancialSummary.findOneAndUpdate(
    { academicSessionId, classId: null },
    {
      $inc: {
        totalInvoiced: invoicedDelta,
        totalWaived: waivedDelta,
        totalOutstanding: outstandingDelta,
      },
      $set: { lastCalculatedAt: new Date() },
    },
    { upsert: true, new: true }
  );
}

export const listInvoices = async (req: Request, res: Response): Promise<void> => {
  const {
    academicSessionId,
    financialYearId,
    classId,
    studentId,
    enrollmentId,
    status,
    page = '1',
    limit = '20',
  } = req.query;

  const query: Record<string, unknown> = {};

  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (financialYearId) query.financialYearId = financialYearId;
  if (classId) query.classId = classId;
  if (studentId) query.studentId = studentId;
  if (enrollmentId) query.enrollmentId = enrollmentId;
  if (status && status !== 'ALL') query.status = status;

  if (req.feeTeacherClassIds && req.feeTeacherClassIds.length > 0) {
    query.classId = { $in: req.feeTeacherClassIds };
    query.status = { $in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] };
  }

  if (req.feeScopedStudentIds && req.feeScopedStudentIds.length > 0) {
    query.studentId = { $in: req.feeScopedStudentIds };
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.max(1, parseInt(limit as string, 10));
  const skip = (pageNum - 1) * limitNum;

  const [invoices, total] = await Promise.all([
    Invoice.find(query)
      .populate('studentId', 'admissionNumber firstName lastName')
      .populate('classId', 'name gradeLevel')
      .sort({ dueDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Invoice.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limitNum);

  sendSuccess(res, 200, 'Invoices retrieved successfully', invoices, {
    totalRecords: total,
    page: pageNum,
    limit: limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  });
};

export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id)
    .populate('studentId', 'admissionNumber firstName lastName')
    .populate('classId', 'name gradeLevel')
    .populate('academicSessionId', 'name startDate endDate')
    .populate('feeStructureId', 'name');

  if (!invoice) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Invoice not found');
  }

  if (req.feeScopedStudentIds && !req.feeScopedStudentIds.includes(invoice.studentId._id.toString())) {
    throw new AppError(
      403,
      ErrorCodes.RBAC_PERMISSION_DENIED,
      'You are not authorized to view this invoice'
    );
  }

  sendSuccess(res, 200, 'Invoice retrieved successfully', invoice);
};

export const generateInvoices = async (req: Request, res: Response): Promise<void> => {
  const validated = GenerateInvoicesSchema.parse(req.body);

  const filter: Record<string, unknown> = {
    academicSessionId: validated.academicSessionId,
    classId: validated.classId,
    enrollmentStatus: 'ACTIVE',
  };

  const enrollments = await Enrollment.find(filter);
  if (enrollments.length === 0) {
    throw new AppError(
      404,
      ErrorCodes.RESOURCE_NOT_FOUND,
      'No active student enrollments found for the specified class and session'
    );
  }

  let feeStructure = null;
  if (validated.feeStructureId) {
    feeStructure = await FeeStructure.findById(validated.feeStructureId)
      .populate('feeComponents.feeHeadId');
  } else {
    feeStructure = await FeeStructure.findOne({
      academicSessionId: validated.academicSessionId,
      classId: validated.classId,
      status: 'ACTIVE',
    }).populate('feeComponents.feeHeadId');
  }

  if (!feeStructure) {
    throw new AppError(
      404,
      ErrorCodes.RESOURCE_NOT_FOUND,
      'Active fee structure not found for this session and class'
    );
  }

  const feeHeadsMap = new Map<string, any>();
  for (const comp of feeStructure.feeComponents) {
    const headDoc = comp.feeHeadId as any;
    if (headDoc && headDoc._id) {
      feeHeadsMap.set(headDoc._id.toString(), headDoc);
    }
  }

  const generatedInvoices = [];
  const now = new Date();
  const dueDate = new Date(validated.dueDate);

  for (const enrollment of enrollments) {
    const existing = await Invoice.findOne({
      academicSessionId: validated.academicSessionId,
      enrollmentId: enrollment._id,
      installmentNumber: validated.installmentNumber,
    });
    if (existing) {
      continue;
    }

    const lineItems = feeStructure.feeComponents
      .filter((c) => !c.isOptional)
      .map((c) => {
        const head = feeHeadsMap.get((c.feeHeadId as any)._id?.toString() || c.feeHeadId.toString()) || {
          name: 'Tuition Fee',
          code: 'TUITION',
        };
        return {
          feeHeadId: (c.feeHeadId as any)._id?.toString() || c.feeHeadId.toString(),
          feeHeadName: head.name,
          feeHeadCode: head.code,
          baseAmount: c.amount,
          discountAmount: 0,
          netAmount: c.amount,
        };
      });

    const baseTotal = lineItems.reduce((sum, item) => sum + item.baseAmount, 0);
    const netTotal = baseTotal;

    const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(10000 + Math.random() * 90000))}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      academicSessionId: validated.academicSessionId,
      financialYearId: validated.financialYearId || feeStructure.financialYearId,
      enrollmentId: enrollment._id,
      studentId: enrollment.studentId,
      classId: validated.classId,
      feeStructureId: feeStructure._id,
      installmentNumber: validated.installmentNumber,
      title: validated.title,
      dueDate,
      lineItems,
      baseTotal,
      discountTotal: 0,
      lateFeeAmount: 0,
      netTotal,
      paidAmount: 0,
      outstandingAmount: netTotal,
      status: validated.status || 'GENERATED',
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    await StudentFeeLedger.findOneAndUpdate(
      {
        academicSessionId: validated.academicSessionId,
        enrollmentId: enrollment._id,
      },
      {
        $setOnInsert: {
          studentId: enrollment.studentId,
          classId: validated.classId,
          financialYearId: validated.financialYearId || feeStructure.financialYearId,
          createdBy: req.user?.id,
        },
        $set: { updatedBy: req.user?.id, lastUpdatedAt: new Date() },
        $inc: { totalInvoiced: netTotal, outstandingBalance: netTotal },
        $push: {
          ledgerEntries: {
            entryId: `LED-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: now,
            entryType: 'INVOICE',
            referenceId: invoice._id,
            referenceNumber: invoiceNumber,
            description: `Fee Invoice Generated: ${validated.title}`,
            debit: netTotal,
            credit: 0,
            runningBalance: netTotal,
          },
        },
      },
      { upsert: true, new: true }
    );

    generatedInvoices.push(invoice);
  }

  if (generatedInvoices.length > 0) {
    const totalNewInvoiced = generatedInvoices.reduce((sum, i) => sum + i.netTotal, 0);
    await updateFinancialSummaryAfterInvoice(
      validated.academicSessionId,
      validated.classId,
      totalNewInvoiced,
      0,
      totalNewInvoiced
    );
  }

  sendSuccess(
    res,
    201,
    `Successfully generated ${generatedInvoices.length} invoices`,
    {
      generatedCount: generatedInvoices.length,
      invoices: generatedInvoices,
    }
  );
};

export const createCustomInvoice = async (req: Request, res: Response): Promise<void> => {
  const validated = CreateCustomInvoiceSchema.parse(req.body);

  const baseTotal = validated.lineItems.reduce((sum, item) => sum + item.baseAmount, 0);
  const discountTotal = validated.lineItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const netTotal = validated.lineItems.reduce((sum, item) => sum + item.netAmount, 0);

  const now = new Date();
  const invoiceNumber = `INV-CUST-${now.getFullYear()}${String(Math.floor(10000 + Math.random() * 90000))}`;

  const invoice = await Invoice.create({
    invoiceNumber,
    academicSessionId: validated.academicSessionId,
    financialYearId: validated.financialYearId,
    enrollmentId: validated.enrollmentId,
    studentId: validated.studentId,
    classId: validated.classId,
    feeStructureId: validated.feeStructureId,
    installmentNumber: validated.installmentNumber,
    title: validated.title,
    dueDate: new Date(validated.dueDate),
    lineItems: validated.lineItems,
    baseTotal,
    discountTotal,
    lateFeeAmount: 0,
    netTotal,
    paidAmount: 0,
    outstandingAmount: netTotal,
    status: validated.status || 'DRAFT',
    remarks: validated.remarks,
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  if (invoice.status !== 'DRAFT') {
    await StudentFeeLedger.findOneAndUpdate(
      {
        academicSessionId: validated.academicSessionId,
        enrollmentId: validated.enrollmentId,
      },
      {
        $setOnInsert: {
          studentId: validated.studentId,
          classId: validated.classId,
          financialYearId: validated.financialYearId,
          createdBy: req.user?.id,
        },
        $set: { updatedBy: req.user?.id, lastUpdatedAt: new Date() },
        $inc: { totalInvoiced: netTotal, outstandingBalance: netTotal },
        $push: {
          ledgerEntries: {
            entryId: `LED-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
            date: now,
            entryType: 'INVOICE',
            referenceId: invoice._id,
            referenceNumber: invoiceNumber,
            description: `Custom Fee Invoice: ${validated.title}`,
            debit: netTotal,
            credit: 0,
            runningBalance: netTotal,
          },
        },
      },
      { upsert: true, new: true }
    );

    await updateFinancialSummaryAfterInvoice(
      validated.academicSessionId,
      validated.classId,
      netTotal,
      0,
      netTotal
    );
  }

  sendSuccess(res, 201, 'Custom invoice created successfully', invoice);
};

export const waiveInvoice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = WaiveInvoiceSchema.parse(req.body);

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Invoice not found');
  }

  if (invoice.status === 'PAID' || invoice.status === 'WAIVED' || invoice.status === 'CANCELLED') {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      `Cannot waive invoice in state ${invoice.status}`
    );
  }

  const waiveAmount =
    validated.waivedAmount !== undefined
      ? Math.min(validated.waivedAmount, invoice.outstandingAmount)
      : invoice.outstandingAmount;

  if (waiveAmount <= 0) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'No outstanding balance remaining to waive on this invoice'
    );
  }

  invoice.outstandingAmount -= waiveAmount;
  if (invoice.outstandingAmount === 0) {
    invoice.status = 'WAIVED';
  } else {
    invoice.status = 'PARTIALLY_PAID';
  }

  invoice.waivedDetails = {
    auditReason: validated.auditReason,
    approvedBy: validated.approvedBy as any,
    waivedAt: new Date(),
    waivedAmount: waiveAmount,
  };
  invoice.updatedBy = req.user?.id as any;
  await invoice.save();

  await StudentFeeLedger.findOneAndUpdate(
    {
      academicSessionId: invoice.academicSessionId,
      enrollmentId: invoice.enrollmentId,
    },
    {
      $inc: { totalWaived: waiveAmount, outstandingBalance: -waiveAmount },
      $set: { updatedBy: req.user?.id, lastUpdatedAt: new Date() },
      $push: {
        ledgerEntries: {
          entryId: `LED-WAIVE-${Date.now()}`,
          date: new Date(),
          entryType: 'WAIVER',
          referenceId: invoice._id,
          referenceNumber: invoice.invoiceNumber,
          description: `Fee Waiver: ${validated.auditReason}`,
          debit: 0,
          credit: waiveAmount,
          runningBalance: invoice.outstandingAmount,
        },
      },
    }
  );

  await updateFinancialSummaryAfterInvoice(
    invoice.academicSessionId.toString(),
    invoice.classId.toString(),
    0,
    waiveAmount,
    -waiveAmount
  );

  sendSuccess(res, 200, 'Invoice waived successfully', invoice);
};

export const cancelInvoice = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = CancelInvoiceSchema.parse(req.body);

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Invoice not found');
  }

  if (invoice.paidAmount > 0) {
    throw new AppError(
      400,
      ErrorCodes.VALIDATION_ERROR,
      'Cannot cancel an invoice with recorded payments; reverse or refund payments first'
    );
  }

  const removedOutstanding = invoice.outstandingAmount;
  invoice.status = 'CANCELLED';
  invoice.outstandingAmount = 0;
  invoice.cancelledDetails = {
    auditReason: validated.auditReason,
    approvedBy: validated.approvedBy as any,
    cancelledAt: new Date(),
  };
  invoice.updatedBy = req.user?.id as any;
  await invoice.save();

  await StudentFeeLedger.findOneAndUpdate(
    {
      academicSessionId: invoice.academicSessionId,
      enrollmentId: invoice.enrollmentId,
    },
    {
      $inc: { totalInvoiced: -invoice.netTotal, outstandingBalance: -removedOutstanding },
      $set: { updatedBy: req.user?.id, lastUpdatedAt: new Date() },
      $push: {
        ledgerEntries: {
          entryId: `LED-CANC-${Date.now()}`,
          date: new Date(),
          entryType: 'ADJUSTMENT',
          referenceId: invoice._id,
          referenceNumber: invoice.invoiceNumber,
          description: `Invoice Cancelled: ${validated.auditReason}`,
          debit: 0,
          credit: removedOutstanding,
          runningBalance: 0,
        },
      },
    }
  );

  await updateFinancialSummaryAfterInvoice(
    invoice.academicSessionId.toString(),
    invoice.classId.toString(),
    -invoice.netTotal,
    0,
    -removedOutstanding
  );

  sendSuccess(res, 200, 'Invoice cancelled successfully', invoice);
};
