import { IdCardUserType, IdCardStatus, ErrorCodes, IdCardRecord } from '@laps/shared';
import { AppError } from '../utils/errors';
import { IdCardTemplate as IdCardTemplateModel, IdCardRecordDb, Student, Teacher, Employee } from '../models';
import { qrService } from './qr.service';

export class IdCardService {
  /**
   * Generates a digital ID Card.
   * Finds the active ID Card if exists, otherwise generates a new one.
   */
  public async generateIdCard(
    schoolId: string,
    referenceId: string,
    userType: IdCardUserType,
    templateId?: string,
    expiryDate?: Date,
  ): Promise<IdCardRecord> {
    
    // Check if an active card already exists
    const existingCard = await IdCardRecordDb.findOne({
      schoolId,
      referenceId,
      userType,
      status: IdCardStatus.ACTIVE,
    });

    if (existingCard) {
      return existingCard.toJSON() as IdCardRecord;
    }

    // Validate referenceId exists
    let userExists = false;
    switch (userType) {
      case IdCardUserType.STUDENT:
        userExists = !!(await Student.findOne({ _id: referenceId, schoolId }));
        break;
      case IdCardUserType.TEACHER:
        userExists = !!(await Teacher.findOne({ _id: referenceId, schoolId }));
        break;
      case IdCardUserType.EMPLOYEE:
        userExists = !!(await Employee.findOne({ _id: referenceId, schoolId }));
        break;
      case IdCardUserType.VISITOR:
      case IdCardUserType.GUARDIAN:
        userExists = true; // Assume true for now
        break;
    }

    if (!userExists) {
      throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'User not found');
    }

    let resolvedTemplateId = templateId;
    
    if (!resolvedTemplateId) {
      const defaultTemplate = await IdCardTemplateModel.findOne({
        schoolId,
        targetUserType: userType,
        isDefault: true,
      });
      if (!defaultTemplate) {
        throw new AppError(400, ErrorCodes.VALIDATION_ERROR, `No default template found for ${userType}.`);
      }
      resolvedTemplateId = defaultTemplate.id;
    }

    // Generate secure QR Token
    const qrCode = await qrService.generateQrCode({
      qrType: `${userType}_ID` as any,
      referenceId,
      metadata: { generatedVia: 'ID_CARD_SYSTEM' },
      expiresAt: expiryDate ? expiryDate.toISOString() : undefined,
    });

    const newCard = new IdCardRecordDb({
      schoolId,
      referenceId,
      userType,
      templateId: resolvedTemplateId,
      status: IdCardStatus.ACTIVE,
      issueDate: new Date(),
      expiryDate,
      qrCodeToken: qrCode.secureToken,
    });

    await newCard.save();
    return newCard.toJSON() as IdCardRecord;
  }

  /**
   * Revokes an ID Card
   */
  public async revokeCard(schoolId: string, cardId: string) {
    const card = await IdCardRecordDb.findOneAndUpdate(
      { _id: cardId, schoolId },
      { status: IdCardStatus.REVOKED },
      { new: true }
    );
    if (!card) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Card not found');
    return card.toJSON();
  }

  /**
   * Get Active Card for User
   */
  public async getActiveCard(schoolId: string, referenceId: string) {
    const card = await IdCardRecordDb.findOne({ schoolId, referenceId, status: IdCardStatus.ACTIVE });
    return card ? card.toJSON() : null;
  }

  // --- Templates ---

  public async getTemplates(schoolId: string, userType?: IdCardUserType) {
    const filter: any = { schoolId };
    if (userType) filter.targetUserType = userType;
    const templates = await IdCardTemplateModel.find(filter);
    return templates.map(t => t.toJSON());
  }

  public async saveTemplate(schoolId: string, templateData: any) {
    if (templateData.isDefault) {
      // Unset other defaults for this user type
      await IdCardTemplateModel.updateMany(
        { schoolId, targetUserType: templateData.targetUserType },
        { isDefault: false }
      );
    }

    if (templateData.id) {
      const updated = await IdCardTemplateModel.findOneAndUpdate(
        { _id: templateData.id, schoolId },
        templateData,
        { new: true }
      );
      if (!updated) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Template not found');
      return updated.toJSON();
    } else {
      const newTemplate = new IdCardTemplateModel({ ...templateData, schoolId });
      await newTemplate.save();
      return newTemplate.toJSON();
    }
  }

  public async getMasterData(schoolId: string, referenceId: string, userType: IdCardUserType) {
    switch (userType) {
      case IdCardUserType.STUDENT:
        return await Student.findOne({ _id: referenceId, schoolId }).populate('currentClass currentSection');
      case IdCardUserType.TEACHER:
        return await Teacher.findOne({ _id: referenceId, schoolId });
      case IdCardUserType.EMPLOYEE:
        return await Employee.findOne({ _id: referenceId, schoolId });
      default:
        return null;
    }
  }
}

export const idCardService = new IdCardService();
