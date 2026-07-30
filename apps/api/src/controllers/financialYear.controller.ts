import { Request, Response } from 'express';
import {
  CreateFinancialYearSchema,
  UpdateFinancialYearSchema,
  ErrorCodes,
} from '@laps/shared';
import { FinancialYear } from '../models/FinancialYear';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listFinancialYears = async (req: Request, res: Response): Promise<void> => {
  const { status = 'ACTIVE' } = req.query;
  const query: Record<string, unknown> = {};

  if (status && status !== 'ALL') {
    query.status = status;
  }

  const financialYears = await FinancialYear.find(query).sort({ startDate: -1 });

  sendSuccess(res, 200, 'Financial years retrieved successfully', financialYears);
};

export const getFinancialYearById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const financialYear = await FinancialYear.findById(id);

  if (!financialYear) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Financial year not found');
  }

  sendSuccess(res, 200, 'Financial year retrieved successfully', financialYear);
};

export const createFinancialYear = async (req: Request, res: Response): Promise<void> => {
  const validated = CreateFinancialYearSchema.parse(req.body);

  const existing = await FinancialYear.findOne({ code: validated.code });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Financial year code "${validated.code}" already exists`
    );
  }

  const financialYear = await FinancialYear.create({
    ...validated,
    startDate: new Date(validated.startDate),
    endDate: new Date(validated.endDate),
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Financial year created successfully', financialYear);
};

export const updateFinancialYear = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = UpdateFinancialYearSchema.parse(req.body);

  const financialYear = await FinancialYear.findById(id);
  if (!financialYear) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Financial year not found');
  }

  if (validated.code && validated.code !== financialYear.code) {
    const conflict = await FinancialYear.findOne({ code: validated.code });
    if (conflict) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Financial year code "${validated.code}" already exists`
      );
    }
  }

  Object.assign(financialYear, {
    ...validated,
    startDate: validated.startDate ? new Date(validated.startDate) : financialYear.startDate,
    endDate: validated.endDate ? new Date(validated.endDate) : financialYear.endDate,
    updatedBy: req.user?.id,
  });

  await financialYear.save();

  sendSuccess(res, 200, 'Financial year updated successfully', financialYear);
};
