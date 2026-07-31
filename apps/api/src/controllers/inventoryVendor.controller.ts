import { Request, Response } from 'express';
import { Vendor } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { CreateVendorSchema, UpdateVendorSchema } from '@laps/shared';
import { isValidObjectId } from 'mongoose';

export class InventoryVendorController {
  static async getVendors(req: Request, res: Response) {
    try {
      const vendors = await Vendor.find({ schoolId: req.user?.schoolId }).sort({ name: 1 });
      return sendSuccess(res, 200, 'Success', { vendors });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch vendors');
    }
  }

  static async createVendor(req: Request, res: Response) {
    try {
      const data = CreateVendorSchema.parse(req.body);
      
      const existing = await Vendor.findOne({ schoolId: req.user?.schoolId, vendorCode: data.vendorCode });
      if (existing) return sendError(res, 409, 'DUPLICATE_RESOURCE', 'Vendor with this code already exists');

      const vendor = new Vendor({ ...data, schoolId: req.user?.schoolId });
      await vendor.save();
      return sendSuccess(res, 201, 'Success', { vendor });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to create vendor');
    }
  }

  static async updateVendor(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Vendor ID');
      const data = UpdateVendorSchema.parse(req.body);
      
      const vendor = await Vendor.findOneAndUpdate(
        { _id: req.params.id, schoolId: req.user?.schoolId },
        { $set: data },
        { new: true }
      );
      if (!vendor) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Vendor not found');
      
      return sendSuccess(res, 200, 'Success', { vendor });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to update vendor');
    }
  }
}
