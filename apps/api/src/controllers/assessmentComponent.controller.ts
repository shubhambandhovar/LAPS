import { Request, Response } from 'express';
import {
  CreateAssessmentComponentSchema,
  UpdateAssessmentComponentSchema,
  ErrorCodes,
} from '@laps/shared';
import { AssessmentComponent } from '../models/AssessmentComponent';
import { AppError } from '../utils/errors';
import { sendSuccess } from '../utils/response';

export const listAssessmentComponents = async (req: Request, res: Response): Promise<void> => {
  const { examId, classSubjectId, status } = req.query;

  const query: Record<string, any> = {
    status: { $ne: 'ARCHIVED' },
  };

  if (examId) query.examId = examId;
  if (classSubjectId) query.classSubjectId = classSubjectId;
  if (status) query.status = status;

  const components = await AssessmentComponent.find(query).sort({ orderSequence: 1, componentName: 1 });

  sendSuccess(res, 200, 'Assessment components retrieved successfully', components);
};

export const getAssessmentComponentById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const component = await AssessmentComponent.findById(id);

  if (!component || component.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Assessment component not found');
  }

  sendSuccess(res, 200, 'Assessment component retrieved successfully', component);
};

export const createAssessmentComponent = async (req: Request, res: Response): Promise<void> => {
  const parsed = CreateAssessmentComponentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid assessment component payload', parsed.error.errors);
  }

  const existing = await AssessmentComponent.findOne({
    examId: parsed.data.examId,
    classSubjectId: parsed.data.classSubjectId,
    componentName: parsed.data.componentName,
    status: 'ACTIVE',
  });
  if (existing) {
    throw new AppError(
      409,
      ErrorCodes.VALIDATION_ERROR,
      `Component "${parsed.data.componentName}" already exists for this subject in the examination`
    );
  }

  const validation = await AssessmentComponent.validateTotalWeightage(
    parsed.data.examId,
    parsed.data.classSubjectId,
    parsed.data.weightage
  );

  if (!validation.isValid) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, validation.message || 'Total weightage cannot exceed 100%');
  }

  const component = await AssessmentComponent.create({
    ...parsed.data,
    status: parsed.data.status || 'ACTIVE',
    createdBy: (req as any).user.id,
    updatedBy: (req as any).user.id,
  });

  sendSuccess(res, 201, 'Assessment component created successfully', component);
};

export const updateAssessmentComponent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const parsed = UpdateAssessmentComponentSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid update payload', parsed.error.errors);
  }

  const component = await AssessmentComponent.findById(id);
  if (!component || component.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Assessment component not found');
  }

  if (parsed.data.weightage !== undefined) {
    const validation = await AssessmentComponent.validateTotalWeightage(
      component.examId,
      component.classSubjectId,
      parsed.data.weightage,
      id
    );

    if (!validation.isValid) {
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, validation.message || 'Total weightage cannot exceed 100%');
    }
  }

  Object.assign(component, parsed.data, {
    updatedBy: (req as any).user.id,
  });

  await component.save();
  sendSuccess(res, 200, 'Assessment component updated successfully', component);
};

export const archiveAssessmentComponent = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const component = await AssessmentComponent.findById(id);

  if (!component || component.status === 'ARCHIVED') {
    throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Assessment component not found');
  }

  component.status = 'ARCHIVED';
  component.updatedBy = (req as any).user.id;

  await component.save();
  sendSuccess(res, 200, 'Assessment component archived successfully', component);
};
