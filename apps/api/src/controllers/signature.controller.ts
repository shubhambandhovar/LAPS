import { Request, Response, NextFunction } from 'express';
import { signatureService } from '../services/signature.service';
import { UserSignatureSchema, ApprovalWorkflowSchema } from '@laps/shared';

export const getUserSignatures = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await signatureService.getUserSignatures(req.user!.schoolId, req.user!.id);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const saveUserSignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = UserSignatureSchema.parse(req.body);
    const sig = await signatureService.saveUserSignature(req.user!.schoolId, req.user!.id, data);
    res.json({ success: true, data: sig });
  } catch (error) {
    next(error);
  }
};

export const deleteUserSignature = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await signatureService.deleteUserSignature(req.user!.schoolId, req.user!.id, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// Workflows
export const getWorkflows = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await signatureService.getWorkflows(req.user!.schoolId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const saveWorkflow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = ApprovalWorkflowSchema.parse(req.body);
    const wf = await signatureService.saveWorkflow(req.user!.schoolId, data);
    res.json({ success: true, data: wf });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkflow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await signatureService.deleteWorkflow(req.user!.schoolId, req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
