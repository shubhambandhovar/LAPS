import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { InventoryVendorController } from '../controllers/inventoryVendor.controller';
import { InventoryAssetController } from '../controllers/inventoryAsset.controller';
import { InventoryConsumableController } from '../controllers/inventoryConsumable.controller';
import { InventoryStockMovementController } from '../controllers/inventoryStockMovement.controller';
import { InventoryAnalyticsController } from '../controllers/inventoryAnalytics.controller';

const router = Router();

router.use(authenticate);

// Vendors
router.get('/vendors', requirePermission('INVENTORY', 'READ', 'vendor'), InventoryVendorController.getVendors);
router.post('/vendors', requirePermission('INVENTORY', 'CREATE', 'vendor'), InventoryVendorController.createVendor);
router.patch('/vendors/:id', requirePermission('INVENTORY', 'UPDATE', 'vendor'), InventoryVendorController.updateVendor);

// Assets
router.get('/assets', requirePermission('INVENTORY', 'READ', 'asset'), InventoryAssetController.getAssets);
router.post('/assets', requirePermission('INVENTORY', 'CREATE', 'asset'), InventoryAssetController.createAsset);
router.patch('/assets/:id', requirePermission('INVENTORY', 'UPDATE', 'asset'), InventoryAssetController.updateAsset);

// Asset Assignments
router.get('/assets/assignments/all', InventoryAssetController.getAssignments); // Self-scoped in controller
router.post('/assets/assign', requirePermission('INVENTORY', 'CREATE', 'asset_assignment'), InventoryAssetController.assignAsset);
router.patch('/assets/assignments/:id/return', requirePermission('INVENTORY', 'UPDATE', 'asset_assignment'), InventoryAssetController.returnAsset);

// Consumables
router.get('/consumables', requirePermission('INVENTORY', 'READ', 'consumable'), InventoryConsumableController.getConsumables);
router.post('/consumables', requirePermission('INVENTORY', 'CREATE', 'consumable'), InventoryConsumableController.createConsumable);
router.patch('/consumables/:id', requirePermission('INVENTORY', 'UPDATE', 'consumable'), InventoryConsumableController.updateConsumable);

// Stock Movements
router.get('/stock/movements', requirePermission('INVENTORY', 'READ', 'stock_movement'), InventoryStockMovementController.getStockMovements);
router.post('/stock/movement', requirePermission('INVENTORY', 'CREATE', 'stock_movement'), InventoryStockMovementController.recordMovement);

// Analytics
router.get('/analytics', requirePermission('INVENTORY', 'READ', 'analytics'), InventoryAnalyticsController.getAnalytics);

export default router;
