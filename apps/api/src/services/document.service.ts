import { DocumentType, DocumentStatus, ErrorCodes, DocumentRecord } from '@laps/shared';
import { AppError } from '../utils/errors';
import { DocumentTemplate, DocumentRecordDb, Sequence, Student, Teacher, Employee, ApprovalWorkflowDb, UserSignatureDb } from '../models';
import { qrService } from './qr.service';

export class DocumentService {
  /**
   * Generates a unique monotonic serial number for a specific document type.
   * Format: {Prefix}-{Year}-{6-digit sequence}
   */
  private async generateSerialNumber(schoolId: string, documentType: DocumentType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = documentType.substring(0, 3).toUpperCase();
    const sequenceKey = `DOC_${documentType}_${year}`;

    const seq = await Sequence.findOneAndUpdate(
      { schoolId, key: sequenceKey },
      { $inc: { sequenceValue: 1 } },
      { new: true, upsert: true }
    );

    const paddedSeq = seq.sequenceValue.toString().padStart(6, '0');
    return `${prefix}-${year}-${paddedSeq}`;
  }

  public async generateDocument(
    schoolId: string,
    referenceId: string,
    referenceModel: 'Student' | 'Teacher' | 'Employee',
    documentType: DocumentType,
    templateId: string,
    generatedBy: string
  ): Promise<DocumentRecord> {
    // 1. Verify Template
    const template = await DocumentTemplate.findOne({ _id: templateId, schoolId, documentType });
    if (!template) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Template not found');

    // 2. Fetch Entity Data for variables (For verification and bindings)
    let entityExists = false;
    if (referenceModel === 'Student') entityExists = !!(await Student.exists({ _id: referenceId, schoolId }));
    else if (referenceModel === 'Teacher') entityExists = !!(await Teacher.exists({ _id: referenceId, schoolId }));
    else if (referenceModel === 'Employee') entityExists = !!(await Employee.exists({ _id: referenceId, schoolId }));

    if (!entityExists) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Entity not found');

    // 3. Generate Serial Number
    const serialNumber = await this.generateSerialNumber(schoolId, documentType);

    // 4. Check for Approval Workflow
    const workflow = await ApprovalWorkflowDb.findOne({ schoolId, documentType, isActive: true });
    
    // 5. Generate QR Token
    const qrCode = await qrService.generateQrCode({
      qrType: 'CERTIFICATE' as any,
      referenceId,
      metadata: { serialNumber, documentType, generatedVia: 'DOCUMENT_SYSTEM' }
    });

    const status = workflow && workflow.requiredRoles.length > 0 ? DocumentStatus.UNDER_REVIEW : DocumentStatus.ISSUED;

    // 6. Save Record
    const record = new DocumentRecordDb({
      schoolId,
      serialNumber,
      documentType,
      templateId,
      workflowId: workflow ? workflow._id : undefined,
      referenceId,
      referenceModel,
      status,
      issuedDate: status === DocumentStatus.ISSUED ? new Date() : undefined,
      qrCodeToken: qrCode.secureToken,
      generatedBy,
      version: 1,
      signatures: [],
    });

    await record.save();
    return record.toJSON() as DocumentRecord;
  }

  public async signDocument(
    schoolId: string, 
    recordId: string, 
    userId: string, 
    role: string, 
    signatureId: string, 
    ipAddress: string
  ) {
    const record = await DocumentRecordDb.findOne({ _id: recordId, schoolId }).populate('workflowId');
    if (!record) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Document not found');
    if (record.status !== DocumentStatus.UNDER_REVIEW) {
      throw new AppError(400, ErrorCodes.BUSINESS_RULE_VIOLATION, 'Document is not under review');
    }

    const signature = await UserSignatureDb.findOne({ _id: signatureId, userId, schoolId, isActive: true });
    if (!signature) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Active signature not found');

    const workflow = record.workflowId as any;
    if (!workflow || !workflow.requiredRoles.includes(role)) {
      throw new AppError(403, ErrorCodes.RBAC_PERMISSION_DENIED, 'You are not required to sign this document');
    }

    // Check if already signed by this role
    if (record.signatures.some(s => s.role === role)) {
      throw new AppError(400, ErrorCodes.BUSINESS_RULE_VIOLATION, 'Already signed by this role');
    }

    record.signatures.push({
      userId: userId as any,
      signatureId: signatureId as any,
      role,
      timestamp: new Date(),
      ipAddress,
    });

    // Check if all required roles have signed
    const signedRoles = record.signatures.map(s => s.role);
    const allSigned = workflow.requiredRoles.every((r: string) => signedRoles.includes(r));

    if (allSigned) {
      record.status = DocumentStatus.ISSUED;
      record.issuedDate = new Date();
    }

    await record.save();
    return record.toJSON();
  }

  public async getApprovalQueue(schoolId: string, role: string) {
    // Find workflows that require this role
    const workflows = await ApprovalWorkflowDb.find({ schoolId, requiredRoles: role, isActive: true });
    const workflowIds = workflows.map(w => w._id);

    // Find documents under review for these workflows, where this role hasn't signed yet
    const records = await DocumentRecordDb.find({
      schoolId,
      status: DocumentStatus.UNDER_REVIEW,
      workflowId: { $in: workflowIds },
      'signatures.role': { $ne: role }
    }).sort({ createdAt: -1 }).populate('templateId');

    return records.map(r => r.toJSON());
  }

  public async revokeDocument(schoolId: string, recordId: string) {
    const record = await DocumentRecordDb.findOneAndUpdate(
      { _id: recordId, schoolId },
      { status: DocumentStatus.REVOKED },
      { new: true }
    );
    if (!record) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Document not found');
    return record.toJSON();
  }

  // --- Templates ---

  public async getTemplates(schoolId: string, documentType?: DocumentType) {
    const filter: any = { schoolId };
    if (documentType) filter.documentType = documentType;
    const templates = await DocumentTemplate.find(filter);
    return templates.map(t => t.toJSON());
  }

  public async getTemplate(schoolId: string, templateId: string) {
    const t = await DocumentTemplate.findOne({ schoolId, _id: templateId });
    if (!t) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Template not found');
    return t.toJSON();
  }

  public async saveTemplate(schoolId: string, templateData: any) {
    if (templateData.id) {
      const updated = await DocumentTemplate.findOneAndUpdate(
        { _id: templateData.id, schoolId },
        templateData,
        { new: true }
      );
      if (!updated) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Template not found');
      return updated.toJSON();
    } else {
      const newTemplate = new DocumentTemplate({ ...templateData, schoolId });
      await newTemplate.save();
      return newTemplate.toJSON();
    }
  }

  public async getDocumentRecords(schoolId: string, filter: any = {}) {
    const records = await DocumentRecordDb.find({ schoolId, ...filter }).sort({ createdAt: -1 });
    return records.map(r => r.toJSON());
  }

  public async getRecordDetails(schoolId: string, recordId: string) {
    const record = await DocumentRecordDb.findOne({ schoolId, _id: recordId }).populate('signatures.signatureId');
    if (!record) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Document not found');
    
    // Fetch master data needed for template binding
    let masterData = null;
    if (record.referenceModel === 'Student') {
      masterData = await Student.findOne({ _id: record.referenceId, schoolId }).populate('currentClass currentSection');
    } else if (record.referenceModel === 'Teacher') {
      masterData = await Teacher.findOne({ _id: record.referenceId, schoolId });
    } else if (record.referenceModel === 'Employee') {
      masterData = await Employee.findOne({ _id: record.referenceId, schoolId });
    }

    return { record: record.toJSON(), masterData };
  }
}

export const documentService = new DocumentService();
