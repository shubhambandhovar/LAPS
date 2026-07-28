import { Schema, model, Document, Types } from 'mongoose';
import { UserRoleCode } from '@laps/shared';

export interface IRole {
  schoolId: string;
  code: UserRoleCode;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleDocument extends IRole, Document {}

const RoleSchema = new Schema<IRoleDocument>(
  {
    schoolId: {
      type: String,
      required: true,
      default: 'LAPS-GOHAD',
      index: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      default: '',
    },
    isSystem: {
      type: Boolean,
      required: true,
      default: false,
    },
    permissions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permission',
      },
    ],
  },
  {
    timestamps: true,
  },
);

RoleSchema.index({ schoolId: 1, code: 1 }, { unique: true });

export const Role = model<IRoleDocument>('Role', RoleSchema);
