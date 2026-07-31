import { Request, Response } from 'express';
import { Asset, AssetAssignment } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { CreateAssetSchema, UpdateAssetSchema, ReturnAssetSchema } from '@laps/shared';
import { isValidObjectId } from 'mongoose';

export class InventoryAssetController {
  
  static async getAssets(req: Request, res: Response) {
    try {
      const assets = await Asset.find({ schoolId: req.user?.schoolId })
        .populate('vendorId')
        .populate('departmentId')
        .sort({ assetCode: 1 });
      return sendSuccess(res, 200, 'Success', { assets });
    } catch (error) {
      return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch assets');
    }
  }

  static async createAsset(req: Request, res: Response) {
    try {
      const data = CreateAssetSchema.parse(req.body);
      
      const existing = await Asset.findOne({ schoolId: req.user?.schoolId, assetCode: data.assetCode });
      if (existing) return sendError(res, 409, 'DUPLICATE_RESOURCE', 'Asset with this code already exists');

      const asset = new Asset({ ...data, schoolId: req.user?.schoolId });
      await asset.save();
      return sendSuccess(res, 201, 'Success', { asset });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to create asset');
    }
  }

  static async updateAsset(req: Request, res: Response) {
    try {
      if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Asset ID');
      const data = UpdateAssetSchema.parse(req.body);
      
      const asset = await Asset.findOneAndUpdate(
        { _id: req.params.id, schoolId: req.user?.schoolId },
        { $set: data },
        { new: true }
      );
      if (!asset) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Asset not found');
      
      return sendSuccess(res, 200, 'Success', { asset });
    } catch (error) {
      return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to update asset');
    }
  }

  static async getAssignments(req: Request, res: Response) {
      try {
          const query: any = { schoolId: req.user?.schoolId };
          
          if (req.user?.userType === 'STAFF' || req.user?.userType === 'TEACHER') {
              if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'SCHOOL_ADMIN' && req.user?.role !== 'STORE_MANAGER') {
                  query.employeeId = req.user.profileRef;
              }
          }

          const assignments = await AssetAssignment.find(query)
              .populate('assetId')
              .sort({ assignedDate: -1 });

          return sendSuccess(res, 200, 'Success', { assignments });
      } catch (error) {
          return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'Failed to fetch asset assignments');
      }
  }

  static async assignAsset(req: Request, res: Response) {
      try {
          const data = req.body;
          
          const asset = await Asset.findOne({ _id: data.assetId, schoolId: req.user?.schoolId });
          if (!asset) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Asset not found');
          if (asset.status !== 'IN_STORAGE') return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Asset is not available for assignment');

          const assignment = new AssetAssignment({
              ...data,
              schoolId: req.user?.schoolId,
              status: 'ASSIGNED'
          });

          await assignment.save();

          asset.status = 'IN_USE';
          if (data.departmentId) {
              asset.departmentId = data.departmentId as any;
          }
          await asset.save();

          return sendSuccess(res, 201, 'Success', { assignment });
      } catch (error) {
          return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to assign asset');
      }
  }

  static async returnAsset(req: Request, res: Response) {
      try {
          if (!isValidObjectId(req.params.id)) return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Invalid Assignment ID');
          const data = ReturnAssetSchema.parse(req.body);
          
          const assignment = await AssetAssignment.findOne({ _id: req.params.id, schoolId: req.user?.schoolId });
          if (!assignment) return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Asset assignment not found');
          if (assignment.status === 'RETURNED') return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Asset is already returned');

          assignment.status = 'RETURNED';
          assignment.returnedDate = new Date(data.returnDate);
          assignment.conditionOnReturn = data.conditionOnReturn;

          await assignment.save();

          const asset = await Asset.findById(assignment.assetId);
          if (asset) {
              asset.status = 'IN_STORAGE';
              // Optionally unset departmentId if it was assigned to employee, or keep it.
              await asset.save();
          }

          return sendSuccess(res, 200, 'Success', { assignment });
      } catch (error) {
          return sendError(res, 400, 'BUSINESS_RULE_VIOLATION', 'Failed to return asset');
      }
  }
}
