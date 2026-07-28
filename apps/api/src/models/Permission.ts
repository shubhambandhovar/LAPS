import { Schema, model, Document } from 'mongoose';

export interface IPermission {
  module: string;
  action: string;
  resource: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPermissionDocument extends IPermission, Document {}

const PermissionSchema = new Schema<IPermissionDocument>(
  {
    module: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    resource: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

PermissionSchema.index({ module: 1, action: 1, resource: 1 }, { unique: true });

export const Permission = model<IPermissionDocument>('Permission', PermissionSchema);
