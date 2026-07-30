import { Request, Response } from 'express';
import { CreateFeeDiscountSchema, UpdateFeeDiscountSchema, ErrorCodes } from '@laps/shared';
import { FeeDiscount } from '../models/FeeDiscount';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listFeeDiscounts = async (req: Request, res: Response): Promise<void> => {
  const { category, status = 'ACTIVE' } = req.query;
  const query: Record<string, unknown> = {};

  if (status && status !== 'ALL') query.status = status;
  if (category && category !== 'ALL') query.category = category;

  const feeDiscounts = await FeeDiscount.find(query)
    .populate('applicableFeeHeadIds', 'name code')
    .sort({ category: 1, name: 1 });

  sendSuccess(res, 200, 'Fee discounts retrieved successfully', feeDiscounts);
};

export const getFeeDiscountById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const feeDiscount = await FeeDiscount.findById(id).populate('applicableFeeHeadIds', 'name code');

  if (!feeDiscount) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Fee discount not found');
  }

  sendSuccess(res, 200, 'Fee discount retrieved successfully', feeDiscount);
};

export const createFeeDiscount = async (req: Request, res: Response): Promise<void> => {
  const validated = CreateFeeDiscountSchema.parse(req.body);

  const existing = await FeeDiscount.findOne({ code: validated.code.toUpperCase() });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Fee discount code "${validated.code}" already exists`
    );
  }

  const feeDiscount = await FeeDiscount.create({
    ...validated,
    code: validated.code.toUpperCase(),
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Fee discount created successfully', feeDiscount);
};

export const updateFeeDiscount = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = UpdateFeeDiscountSchema.parse(req.body);

  const feeDiscount = await FeeDiscount.findById(id);
  if (!feeDiscount) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Fee discount not found');
  }

  if (validated.code && validated.code.toUpperCase() !== feeDiscount.code) {
    const conflict = await FeeDiscount.findOne({ code: validated.code.toUpperCase() });
    if (conflict) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Fee discount code "${validated.code}" already exists`
      );
    }
  }

  Object.assign(feeDiscount, {
    ...validated,
    code: validated.code ? validated.code.toUpperCase() : feeDiscount.code,
    updatedBy: req.user?.id,
  });

  await feeDiscount.save();

  sendSuccess(res, 200, 'Fee discount updated successfully', feeDiscount);
};

export const archiveFeeDiscount = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const feeDiscount = await FeeDiscount.findById(id);

  if (!feeDiscount) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Fee discount not found');
  }

  feeDiscount.status = 'ARCHIVED';
  feeDiscount.updatedBy = req.user?.id as any;
  await feeDiscount.save();

  sendSuccess(res, 200, 'Fee discount archived successfully', feeDiscount);
};
