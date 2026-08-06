import { Request, Response, NextFunction } from 'express';
import { GenerateDocumentRequestSchema, DocumentTemplateSchema, DocumentType } from '@laps/shared';
import { documentService } from '../services/document.service';

export const getTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentType = req.query.documentType as DocumentType | undefined;
    const templates = await documentService.getTemplates(req.user!.schoolId, documentType);
    res.json({ success: true, data: templates });
  } catch (error) {
    next(error);
  }
};

export const getTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await documentService.getTemplate(req.user!.schoolId, req.params.id);
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const saveTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = DocumentTemplateSchema.parse(req.body);
    const template = await documentService.saveTemplate(req.user!.schoolId, data);
    res.json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
};

export const generateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = GenerateDocumentRequestSchema.parse(req.body);
    const record = await documentService.generateDocument(
      req.user!.schoolId,
      data.referenceId,
      data.referenceModel,
      data.documentType,
      data.templateId,
      req.user!.id
    );
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const getRecords = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Basic filter query support
    const filter: any = {};
    if (req.query.documentType) filter.documentType = req.query.documentType;
    if (req.query.referenceId) filter.referenceId = req.query.referenceId;
    if (req.query.status) filter.status = req.query.status;

    const records = await documentService.getDocumentRecords(req.user!.schoolId, filter);
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const getRecordDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await documentService.getRecordDetails(req.user!.schoolId, req.params.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getApprovalQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const records = await documentService.getApprovalQueue(req.user!.schoolId, req.user!.role);
    res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

export const signDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { signatureId } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const record = await documentService.signDocument(
      req.user!.schoolId,
      req.params.id,
      req.user!.id,
      req.user!.role,
      signatureId,
      ipAddress
    );
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};

export const revokeDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await documentService.revokeDocument(req.user!.schoolId, req.params.id);
    res.json({ success: true, data: record });
  } catch (error) {
    next(error);
  }
};
