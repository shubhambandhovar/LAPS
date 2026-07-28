import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshSession {
  userId: Types.ObjectId;
  sessionFamilyId: string;
  tokenHash: string;
  userAgent: string;
  ip: string;
  isRevoked: boolean;
  revokedAt?: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  rotatedToTokenHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshSessionDocument extends IRefreshSession, Document {}

const RefreshSessionSchema = new Schema<IRefreshSessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionFamilyId: {
      type: String,
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
      index: true,
    },
    userAgent: {
      type: String,
      default: 'Unknown Device',
    },
    ip: {
      type: String,
      default: '0.0.0.0',
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    rotatedToTokenHash: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

RefreshSessionSchema.index({ userId: 1, isRevoked: 1 });
RefreshSessionSchema.index({ sessionFamilyId: 1 });
RefreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshSession = model<IRefreshSessionDocument>(
  'RefreshSession',
  RefreshSessionSchema,
);
