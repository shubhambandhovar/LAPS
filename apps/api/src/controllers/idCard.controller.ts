import { Request, Response, NextFunction } from 'express';
import { GenerateIdCardRequestSchema, IdCardTemplateSchema, IdCardUserType } from '@laps/shared';
import { idCardService } from '../services/idCard.service';

export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userType = req.query.userType as IdCardUserType | undefined;
    const templates = await idCardService.getTemplates(req.user!.schoolId, userType);
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const saveTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = IdCardTemplateSchema.parse(req.body);
    const template = await idCardService.saveTemplate(req.user!.schoolId, data);
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const generateCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = GenerateIdCardRequestSchema.parse(req.body);
    const card = await idCardService.generateIdCard(
      req.user!.schoolId,
      data.referenceId,
      data.userType,
      data.templateId,
      data.expiryDate ? new Date(data.expiryDate) : undefined
    );
    res.json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

export const getActiveCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await idCardService.getActiveCard(req.user!.schoolId, req.params.referenceId);
    res.json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

export const getCardMasterData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userType = req.query.userType as IdCardUserType;
    const data = await idCardService.getMasterData(req.user!.schoolId, req.params.referenceId, userType);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const revokeCard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await idCardService.revokeCard(req.user!.schoolId, req.params.id);
    res.json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};
