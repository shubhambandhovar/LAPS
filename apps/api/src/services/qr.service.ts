import crypto from 'crypto';
import { QrCodeModel, QrScanLogModel, QrCodeDocument } from '../models';
import {
  Student,
  Teacher,
  Employee,
  Guardian,
  Book,
  Asset,
  Receipt,
  BookIssue,
} from '../models';
import {
  QrType,
  QrStatus,
  QrScanResult,
  GenerateQrRequest,
  VerifiedQrResponse,
  ErrorCodes,
} from '@laps/shared';
import { AppError } from '../utils/errors';

export class QrService {
  /**
   * Generates a new secure QR Code token for the given entity.
   */
  async generateQrCode(payload: GenerateQrRequest): Promise<QrCodeDocument> {
    // Check if an ACTIVE code already exists for this entity to prevent duplicates
    let existingQr = await QrCodeModel.findOne({
      qrType: payload.qrType,
      referenceId: payload.referenceId,
      status: QrStatus.ACTIVE,
    });

    if (existingQr) {
      // Regenerate if asked, otherwise return existing
      // For now, we'll just return the existing active one
      return existingQr;
    }

    const secureToken = crypto.randomBytes(32).toString('hex');

    const qr = await QrCodeModel.create({
      qrType: payload.qrType,
      referenceId: payload.referenceId,
      secureToken,
      status: QrStatus.ACTIVE,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      metadata: payload.metadata || {},
    });

    return qr;
  }

  /**
   * Bulk generates QR codes for a given list of entities.
   */
  async bulkGenerateQrCodes(payloads: GenerateQrRequest[]): Promise<QrCodeDocument[]> {
    const results: QrCodeDocument[] = [];
    for (const p of payloads) {
      const qr = await this.generateQrCode(p);
      results.push(qr);
    }
    return results;
  }

  /**
   * Verifies the scanned token, logs the scan, and resolves the underlying entity.
   */
  async verifyAndResolveQr(
    secureToken: string,
    action: string,
    userId: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<VerifiedQrResponse> {
    const qr = await QrCodeModel.findOne({ secureToken });

    if (!qr) {
      await this.logScan(null, userId, action, QrScanResult.INVALID, deviceInfo, ipAddress);
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'Invalid or unrecognized QR Code.');
    }

    // Check expiration
    if (qr.expiresAt && new Date() > qr.expiresAt && qr.status === QrStatus.ACTIVE) {
      qr.status = QrStatus.EXPIRED;
      await qr.save();
    }

    if (qr.status === QrStatus.EXPIRED) {
      await this.logScan(qr.id, userId, action, QrScanResult.EXPIRED, deviceInfo, ipAddress);
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'This QR Code has expired.');
    }

    if (qr.status === QrStatus.CANCELLED) {
      await this.logScan(qr.id, userId, action, QrScanResult.INVALID, deviceInfo, ipAddress);
      throw new AppError(400, ErrorCodes.VALIDATION_ERROR, 'This QR Code has been cancelled/revoked.');
    }

    // If it reaches here, the QR code itself is valid.
    // Now we must resolve the entity.
    let entity: any = null;
    let message = 'QR Code verified successfully.';

    try {
      switch (qr.qrType) {
        case QrType.STUDENT_ID:
          entity = await Student.findById(qr.referenceId)
            .select('firstName lastName admissionNumber class section status')
            .lean();
          break;
        case QrType.TEACHER_ID:
          entity = await Teacher.findById(qr.referenceId)
            .select('firstName lastName employeeId department status')
            .lean();
          break;
        case QrType.EMPLOYEE_ID:
          entity = await Employee.findById(qr.referenceId)
            .select('firstName lastName employeeId department designation status')
            .lean();
          break;
        case QrType.GUARDIAN_CARD:
          entity = await Guardian.findById(qr.referenceId)
            .select('firstName lastName relation phone status')
            .lean();
          break;
        case QrType.LIBRARY_BOOK:
          entity = await Book.findById(qr.referenceId)
            .select('title author isbn publisher status')
            .lean();
          break;
        case QrType.BOOK_ISSUE:
          entity = await BookIssue.findById(qr.referenceId)
            .populate('bookId studentId')
            .lean();
          break;
        case QrType.FEE_RECEIPT:
          entity = await Receipt.findById(qr.referenceId).lean();
          break;
        case QrType.ASSET:
          entity = await Asset.findById(qr.referenceId)
            .select('name category status barcode location')
            .lean();
          break;
        case QrType.TRANSPORT:
          // Transport pass could map to Student
          entity = await Student.findById(qr.referenceId)
            .select('firstName lastName admissionNumber transportRoute status')
            .lean();
          message = 'Transport boarding pass verified.';
          break;
        case QrType.VISITOR_PASS:
          // For visitor passes, all info is usually embedded in metadata at generation time
          entity = qr.metadata;
          message = 'Visitor pass verified.';
          break;
        default:
          entity = { _id: qr.referenceId };
          break;
      }

      if (!entity) {
        throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'Resolved entity could not be found.');
      }

      await this.logScan(qr.id, userId, action, QrScanResult.SUCCESS, deviceInfo, ipAddress);

      return {
        valid: true,
        qrType: qr.qrType,
        referenceId: qr.referenceId,
        metadata: qr.metadata || undefined,
        message,
        entity,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      await this.logScan(qr.id, userId, action, QrScanResult.FORBIDDEN, deviceInfo, ipAddress);
      throw new AppError(500, ErrorCodes.INTERNAL_SERVER_ERROR, 'Error resolving QR entity');
    }
  }

  /**
   * Internal function to log the scan attempt.
   */
  private async logScan(
    qrCodeId: string | null,
    scannedBy: string,
    action: string,
    result: QrScanResult,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<void> {
    await QrScanLogModel.create({
      qrCodeId: qrCodeId || 'UNKNOWN_QR',
      scannedBy,
      action,
      result,
      deviceInfo,
      ipAddress,
    });
  }

  /**
   * Fetches scan history with pagination
   */
  async getScanHistory(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      QrScanLogModel.find()
        .sort({ scannedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      QrScanLogModel.countDocuments(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Revoke/Deactivate a QR Code
   */
  async revokeQrCode(id: string): Promise<QrCodeDocument> {
    const qr = await QrCodeModel.findByIdAndUpdate(
      id,
      { status: QrStatus.CANCELLED },
      { new: true },
    );
    if (!qr) throw new AppError(404, ErrorCodes.RESOURCE_NOT_FOUND, 'QR Code not found');
    return qr;
  }
}

export const qrService = new QrService();
