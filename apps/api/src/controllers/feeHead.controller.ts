import { Request, Response } from 'express';
import { CreateFeeHeadSchema, UpdateFeeHeadSchema, ErrorCodes } from '@laps/shared';
import { FeeHead } from '../models/FeeHead';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listFeeHeads = async (req: Request, res: Response): Promise<void> => {
  const { category, status = 'ACTIVE' } = req.query;
  const query: Record<string, unknown> = {};

  if (status && status !== 'ALL') {
    query.status = status;
  }
  if (category && category !== 'ALL') {
    query.category = category;
  }

  const feeHeads = await FeeHead.find(query).sort({ category: 1, name: 1 });

  sendSuccess(res, 200, 'Fee heads retrieved successfully', feeHeads);
};

export const getFeeHeadById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const feeHead = await FeeHead.findById(id);

  if (!feeHead) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Fee head not found');
  }

  sendSuccess(res, 200, 'Fee head retrieved successfully', feeHead);
};

export const createFeeHead = async (req: Request, res: Response): Promise<void> => {
  const validated = CreateFeeHeadSchema.parse(req.body);

  const existingCode = await FeeHead.findOne({ code: validated.code.toUpperCase() });
  if (existingCode) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Fee head code "${validated.code}" already exists`
    );
  }

  const existingName = await FeeHead.findOne({ name: validated.name });
  if (existingName) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Fee head name "${validated.name}" already exists`
    );
  }

  const feeHead = await FeeHead.create({
    ...validated,
    code: validated.code.toUpperCase(),
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Fee head created successfully', feeHead);
};

export const updateFeeHead = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = UpdateFeeHeadSchema.parse(req.body);

  const feeHead = await FeeHead.findById(id);
  if (!feeHead) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Fee head not found');
  }

  if (validated.code && validated.code.toUpperCase() !== feeHead.code) {
    const conflict = await FeeHead.findOne({ code: validated.code.toUpperCase() });
    if (conflict) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Fee head code "${validated.code}" already exists`
      );
    }
  }

  Object.assign(feeHead, {
    ...validated,
    code: validated.code ? validated.code.toUpperCase() : feeHead.code,
    updatedBy: req.user?.id,
  });

  await feeHead.save();

  sendSuccess(res, 200, 'Fee head updated successfully', feeHead);
};

export const archiveFeeHead = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const feeHead = await FeeHead.findById(id);

  if (!feeHead) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Fee head not found');
  }

  feeHead.status = 'ARCHIVED';
  feeHead.updatedBy = req.user?.id as any;
  await feeHead.save();

  sendSuccess(res, 200, 'Fee head archived successfully', feeHead);
};
