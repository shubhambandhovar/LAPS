import { Request, Response } from 'express';
import { Consumable, StockMovement } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { StockMovementSchema } from '@laps/shared';

export class InventoryStockMovementController {
  
  static async getStockMovements(req: Request, res: Response) {
    try {
      const movements = await StockMovement.find({ schoolId: req.user?.schoolId })
        .populate('consumableId')
        .populate('vendorId')
        .populate('departmentId')
        .populate('recordedByUserId', 'identifier email')
        .sort({ movementDate: -1 });
      return sendSuccess(res, 200, 'Success', { movements });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch stock movements');
    }
  }

  static async recordMovement(req: Request, res: Response) {
    try {
      const data = StockMovementSchema.parse(req.body);
      
      const consumable = await Consumable.findOne({ _id: data.consumableId, schoolId: req.user?.schoolId });
      if (!consumable) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Consumable not found');

      let newStock = consumable.currentStock;

      if (data.movementType === 'PURCHASE' || data.movementType === 'RETURN') {
          newStock += data.quantity;
      } else if (data.movementType === 'ISSUE') {
          if (data.quantity > consumable.currentStock) {
              return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Insufficient stock for issue');
          }
          newStock -= data.quantity;
      } else if (data.movementType === 'ADJUSTMENT') {
          newStock += data.quantity;
          if (newStock < 0) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Adjustment results in negative stock');
      }

      const movement = new StockMovement({
          ...data,
          schoolId: req.user?.schoolId,
          recordedByUserId: req.user?.id
      });

      await movement.save();

      consumable.currentStock = newStock;
      await consumable.save();

      return sendSuccess(res, 201, 'Success', { movement, currentStock: newStock });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to record stock movement');
    }
  }
}
