import { Request, Response } from 'express';
import { CreateFeeStructureSchema, UpdateFeeStructureSchema, ErrorCodes } from '@laps/shared';
import { FeeStructure } from '../models/FeeStructure';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listFeeStructures = async (req: Request, res: Response): Promise<void> => {
  const { academicSessionId, financialYearId, classId, status = 'ACTIVE' } = req.query;
  const query: Record<string, unknown> = {};

  if (academicSessionId) query.academicSessionId = academicSessionId;
  if (financialYearId) query.financialYearId = financialYearId;
  if (classId) query.classId = classId;
  if (status && status !== 'ALL') query.status = status;

  const feeStructures = await FeeStructure.find(query)
    .populate('academicSessionId', 'name startDate endDate')
    .populate('financialYearId', 'code name')
    .populate('classId', 'name gradeLevel')
    .populate('feeComponents.feeHeadId', 'name code category frequency')
    .sort({ createdAt: -1 });

  sendSuccess(res, 200, 'Fee structures retrieved successfully', feeStructures);
};

export const getFeeStructureById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const feeStructure = await FeeStructure.findById(id)
    .populate('academicSessionId', 'name startDate endDate')
    .populate('financialYearId', 'code name')
    .populate('classId', 'name gradeLevel')
    .populate('feeComponents.feeHeadId', 'name code category frequency');

  if (!feeStructure) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Fee structure not found');
  }

  sendSuccess(res, 200, 'Fee structure retrieved successfully', feeStructure);
};

export const createFeeStructure = async (req: Request, res: Response): Promise<void> => {
  const validated = CreateFeeStructureSchema.parse(req.body);

  const totalAmount = validated.feeComponents.reduce(
    (sum, comp) => sum + (comp.isOptional ? 0 : comp.amount),
    0
  );

  const feeStructure = await FeeStructure.create({
    ...validated,
    totalAmount,
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Fee structure created successfully', feeStructure);
};

export const updateFeeStructure = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = UpdateFeeStructureSchema.parse(req.body);

  const feeStructure = await FeeStructure.findById(id);
  if (!feeStructure) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Fee structure not found');
  }

  let totalAmount = feeStructure.totalAmount;
  if (validated.feeComponents) {
    totalAmount = validated.feeComponents.reduce(
      (sum, comp) => sum + (comp.isOptional ? 0 : comp.amount),
      0
    );
  }

  Object.assign(feeStructure, {
    ...validated,
    totalAmount,
    updatedBy: req.user?.id,
  });

  await feeStructure.save();

  sendSuccess(res, 200, 'Fee structure updated successfully', feeStructure);
};

export const archiveFeeStructure = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const feeStructure = await FeeStructure.findById(id);

  if (!feeStructure) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Fee structure not found');
  }

  feeStructure.status = 'ARCHIVED';
  feeStructure.updatedBy = req.user?.id as any;
  await feeStructure.save();

  sendSuccess(res, 200, 'Fee structure archived successfully', feeStructure);
};
