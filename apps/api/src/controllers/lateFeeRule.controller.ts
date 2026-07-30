import { Request, Response } from 'express';
import { CreateLateFeeRuleSchema, UpdateLateFeeRuleSchema, ErrorCodes } from '@laps/shared';
import { LateFeeRule } from '../models/LateFeeRule';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listLateFeeRules = async (req: Request, res: Response): Promise<void> => {
  const { status = 'ACTIVE' } = req.query;
  const query: Record<string, unknown> = {};

  if (status && status !== 'ALL') query.status = status;

  const rules = await LateFeeRule.find(query).sort({ name: 1 });

  sendSuccess(res, 200, 'Late fee rules retrieved successfully', rules);
};

export const getLateFeeRuleById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const rule = await LateFeeRule.findById(id);

  if (!rule) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Late fee rule not found');
  }

  sendSuccess(res, 200, 'Late fee rule retrieved successfully', rule);
};

export const createLateFeeRule = async (req: Request, res: Response): Promise<void> => {
  const validated = CreateLateFeeRuleSchema.parse(req.body);

  const existing = await LateFeeRule.findOne({ name: validated.name });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Late fee rule name "${validated.name}" already exists`
    );
  }

  const rule = await LateFeeRule.create({
    ...validated,
    createdBy: req.user?.id,
    updatedBy: req.user?.id,
  });

  sendSuccess(res, 201, 'Late fee rule created successfully', rule);
};

export const updateLateFeeRule = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const validated = UpdateLateFeeRuleSchema.parse(req.body);

  const rule = await LateFeeRule.findById(id);
  if (!rule) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Late fee rule not found');
  }

  if (validated.name && validated.name !== rule.name) {
    const conflict = await LateFeeRule.findOne({ name: validated.name });
    if (conflict) {
      throw new AppError(
        409,
        ErrorCodes.VALIDATION_ERROR,
        `Late fee rule name "${validated.name}" already exists`
      );
    }
  }

  Object.assign(rule, {
    ...validated,
    updatedBy: req.user?.id,
  });

  await rule.save();

  sendSuccess(res, 200, 'Late fee rule updated successfully', rule);
};

export const archiveLateFeeRule = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const rule = await LateFeeRule.findById(id);

  if (!rule) {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Late fee rule not found');
  }

  rule.status = 'ARCHIVED';
  rule.updatedBy = req.user?.id as any;
  await rule.save();

  sendSuccess(res, 200, 'Late fee rule archived successfully', rule);
};
