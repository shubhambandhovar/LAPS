import { UserSignatureDb, ApprovalWorkflowDb } from '../models';
import { AppError } from '../utils/errors';
import { ErrorCodes } from '@laps/shared';

export class SignatureService {
  // --- Signatures ---
  public async getUserSignatures(schoolId: string, userId: string) {
    const signatures = await UserSignatureDb.find({ schoolId, userId });
    return signatures.map(s => s.toJSON());
  }

  public async saveUserSignature(schoolId: string, userId: string, data: any) {
    if (data.id) {
      const updated = await UserSignatureDb.findOneAndUpdate(
        { _id: data.id, schoolId, userId },
        data,
        { new: true }
      );
      if (!updated) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Signature not found');
      return updated.toJSON();
    } else {
      const sig = new UserSignatureDb({ ...data, schoolId, userId });
      await sig.save();
      return sig.toJSON();
    }
  }

  public async deleteUserSignature(schoolId: string, userId: string, id: string) {
    const deleted = await UserSignatureDb.findOneAndDelete({ _id: id, schoolId, userId });
    if (!deleted) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Signature not found');
    return true;
  }

  // --- Workflows ---
  public async getWorkflows(schoolId: string) {
    const workflows = await ApprovalWorkflowDb.find({ schoolId });
    return workflows.map(w => w.toJSON());
  }

  public async saveWorkflow(schoolId: string, data: any) {
    if (data.id) {
      const updated = await ApprovalWorkflowDb.findOneAndUpdate(
        { _id: data.id, schoolId },
        data,
        { new: true }
      );
      if (!updated) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Workflow not found');
      return updated.toJSON();
    } else {
      const wf = new ApprovalWorkflowDb({ ...data, schoolId });
      await wf.save();
      return wf.toJSON();
    }
  }

  public async deleteWorkflow(schoolId: string, id: string) {
    const deleted = await ApprovalWorkflowDb.findOneAndDelete({ _id: id, schoolId });
    if (!deleted) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Workflow not found');
    return true;
  }
}

export const signatureService = new SignatureService();
