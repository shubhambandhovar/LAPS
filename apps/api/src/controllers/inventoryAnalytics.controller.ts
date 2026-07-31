import { Request, Response } from 'express';
import { Consumable, Asset } from '../models';
import { sendSuccess, sendError } from '../utils/response';

export class InventoryAnalyticsController {
  
  static async getAnalytics(req: Request, res: Response) {
    try {
      const schoolId = req.user?.schoolId;

      // 1. Asset Value
      const assets = await Asset.find({ schoolId });
      const totalAssetValue = assets.reduce((sum, asset) => sum + (asset.purchasePrice || 0), 0);
      const totalAssets = assets.length;
      
      const assetsInUse = assets.filter(a => a.status === 'IN_USE').length;
      const assetsUnderRepair = assets.filter(a => a.status === 'UNDER_REPAIR').length;

      // 2. Low Stock Alerts
      const consumables = await Consumable.find({ schoolId });
      const lowStockItems = consumables.filter(c => c.currentStock < c.minimumStock);

      return sendSuccess(res, 200, 'Success', { 
          totalAssetValue,
          totalAssets,
          assetsInUse,
          assetsUnderRepair,
          lowStockCount: lowStockItems.length,
          lowStockItems
      });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch inventory analytics');
    }
  }
}
