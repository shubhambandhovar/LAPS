import { Request, Response, NextFunction } from 'express';
import { qrService } from '../services/qr.service';
import { QrCodeModel } from '../models';
import { GenerateQrRequestSchema, VerifyQrRequestSchema } from '@laps/shared';
import { z } from 'zod';

export const generateQr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = GenerateQrRequestSchema.parse(req.body);
    const qr = await qrService.generateQrCode(payload);
    res.status(201).json({
      success: true,
      data: qr,
    });
  } catch (error) {
    next(error);
  }
};

export const bulkGenerateQr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payloads = z.array(GenerateQrRequestSchema).parse(req.body);
    const qrs = await qrService.bulkGenerateQrCodes(payloads);
    res.status(201).json({
      success: true,
      data: qrs,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyQr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = VerifyQrRequestSchema.parse(req.body);
    const userId = req.user?.id || 'UNKNOWN';

    // The service handles throwing AppError on invalid/expired codes
    const result = await qrService.verifyAndResolveQr(
      payload.secureToken,
      payload.action,
      userId,
      payload.deviceInfo,
      req.ip,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getScanHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await qrService.getScanHistory(page, limit);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

export const revokeQr = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const qr = await qrService.revokeQrCode(id);

    res.status(200).json({
      success: true,
      data: qr,
      message: 'QR Code revoked successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getQrById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const qr = await QrCodeModel.findById(id).lean();

    if (!qr) {
      return res.status(404).json({ success: false, message: 'QR Code not found' });
    }

    res.status(200).json({
      success: true,
      data: qr,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveQrForReference = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { referenceId } = req.params;
    const qr = await QrCodeModel.findOne({ referenceId, status: 'ACTIVE' }).lean();

    if (!qr) {
      return res.status(404).json({ success: false, message: 'No active QR found for reference' });
    }

    res.status(200).json({
      success: true,
      data: qr,
    });
  } catch (error) {
    next(error);
  }
};
