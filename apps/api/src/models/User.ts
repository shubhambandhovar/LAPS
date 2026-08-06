import { Schema, model, Document, Types } from 'mongoose';
import { UserRoleCode, AccountStatus } from '@laps/shared';

export interface IUser {
  schoolId: string;
  identifier: string;
  email?: string;
  phone?: string;
  passwordHash: string;
  roleId: Types.ObjectId;
  roleCode: UserRoleCode;
  userType: UserRoleCode;
  profileRef?: Types.ObjectId;
  status: AccountStatus;
  lastLoginAt?: Date;
  passwordChangedAt?: Date;
  forcePasswordChange?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    schoolId: {
      type: String,
      required: true,
      default: 'LAPS-GOHAD',
      index: true,
    },
    identifier: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
      index: true,
    },
    roleCode: {
      type: String,
      required: true,
      uppercase: true,
    },
    userType: {
      type: String,
      required: true,
      uppercase: true,
      enum: ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN', 'STAFF', 'APPLICANT'],
    },
    profileRef: {
      type: Schema.Types.ObjectId,
    },
    status: {
      type: String,
      enum: [
        'PENDING',
        'ACTIVE',
        'LOCKED',
        'DISABLED',
        'PASSWORD_RESET_REQUIRED',
        'SUSPENDED',
        'INACTIVE',
      ],
      default: 'ACTIVE',
      index: true,
    },
    lastLoginAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    forcePasswordChange: {
      type: Boolean,
      default: false,
      index: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

UserSchema.index({ schoolId: 1, identifier: 1 }, { unique: true });
UserSchema.index({ schoolId: 1, email: 1 }, { unique: true, sparse: true });
UserSchema.index({ schoolId: 1, userType: 1, status: 1 });

export const User = model<IUserDocument>('User', UserSchema);
