import { Request, Response } from 'express';
import { Consumable } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { CreateConsumableSchema, UpdateConsumableSchema } from '@laps/shared';
import { isValidObjectId } from 'mongoose';

export class InventoryConsumableController {
  
  static async getConsumables(req: Request, res: Response) {
    try {
      const consumables = await Consumable.find({ schoolId: req.user?.schoolId }).sort({ name: 1 });
      return sendSuccess(res, 200, 'Success', { consumables });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch consumables');
    }
  }

  static async createConsumable(req: Request, res: Response) {
    try {
      const data = CreateConsumableSchema.parse(req.body);
      
      const existing = await Consumable.findOne({ 
          schoolId: req.user?.schoolId, 
          name: data.name,
          category: data.category 
      });
      if (existing) return sendError(res, 409, 'DUPLICATE_RESOURCE', 'Consumable with this name and category already exists');

      const consumable = new Consumable({ ...data, schoolId: req.user?.schoolId });
      await consumable.save();
      return sendSuccess(res, 201, 'Success', { consumable });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to create consumable');
    }
  }

  static async updateConsumable(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Consumable ID');
      const data = UpdateConsumableSchema.parse(req.body);
      
      const consumable = await Consumable.findOneAndUpdate(
        { _id: req.params.id, schoolId: req.user?.schoolId },
        { $set: data },
        { new: true }
      );
      if (!consumable) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Consumable not found');
      
      return sendSuccess(res, 200, 'Success', { consumable });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to update consumable');
    }
  }
}
