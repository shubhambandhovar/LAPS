import { Schema, model, Document, Types } from 'mongoose';

export interface IAsset {
  schoolId: string;
  assetCode: string;
  name: string;
  category: 'IT_EQUIPMENT' | 'FURNITURE' | 'LAB_EQUIPMENT' | 'VEHICLE' | 'OTHER';
  vendorId?: Types.ObjectId;
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiryDate?: Date;
  location?: string;
  departmentId?: Types.ObjectId;
  status: 'IN_USE' | 'IN_STORAGE' | 'UNDER_REPAIR' | 'DISCARDED';
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssetDocument extends IAsset, Document {}

const AssetSchema = new Schema<IAssetDocument>(
  {
    schoolId: { type: String, required: true, default: 'LAPS-GOHAD', index: true },
    assetCode: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['IT_EQUIPMENT', 'FURNITURE', 'LAB_EQUIPMENT', 'VEHICLE', 'OTHER'],
      required: true,
      index: true,
    },
    vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor', index: true },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, min: 0 },
    warrantyExpiryDate: { type: Date },
    location: { type: String },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    status: {
      type: String,
      enum: ['IN_USE', 'IN_STORAGE', 'UNDER_REPAIR', 'DISCARDED'],
      default: 'IN_STORAGE',
      index: true,
    },
  },
  { timestamps: true }
);

AssetSchema.index({ schoolId: 1, assetCode: 1 }, { unique: true });
AssetSchema.index({ schoolId: 1, category: 1, status: 1 });

export const Asset = model<IAssetDocument>('Asset', AssetSchema);
